from __future__ import annotations

import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.api.v1.router import api_router
from app.core.db import get_db
from app.models.course import Course
from app.models.user_activity import UserActivity
from tests.postgres_test_harness import PostgresTestDatabase


class PulseApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_db = PostgresTestDatabase()
        self.engine = self.test_db.engine
        self.SessionLocal = self.test_db.SessionLocal
        self._seed_courses()

        self.app = FastAPI()
        self.app.include_router(api_router, prefix="/api/v1")

        def override_get_db():
            db = self.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        self.app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(self.app)

    def tearDown(self) -> None:
        self.client.close()
        self.test_db.dispose()

    def _seed_courses(self) -> None:
        with self.SessionLocal() as db:
            db.add_all(
                [
                    Course(
                        title="Алгебра интенсив",
                        description="Подготовка к задачам с параметрами и производной.",
                        category="Математика",
                        level="Advanced",
                        lessons_count=20,
                        estimated_hours=30,
                    ),
                    Course(
                        title="Русский база",
                        description="Сочинение, комментарий и аргументация.",
                        category="Русский язык",
                        level="Intermediate",
                        lessons_count=18,
                        estimated_hours=24,
                    ),
                ]
            )
            db.commit()

    def _register(self) -> dict[str, str]:
        response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "pulse@example.com",
                "fullName": "Pulse Student",
                "password": "student123",
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        access_token = response.json()["accessToken"]
        return {"Authorization": f"Bearer {access_token}"}

    def _count_activities(self, event_type: str) -> int:
        with self.SessionLocal() as db:
            return db.scalar(
                select(func.count()).select_from(UserActivity).where(UserActivity.event_type == event_type)
            ) or 0

    def test_profile_visit_and_learning_pulse_use_real_account_activity(self) -> None:
        headers = self._register()

        profile_response = self.client.get("/api/v1/user/profile", headers=headers)
        self.assertEqual(profile_response.status_code, 200, profile_response.text)
        self.assertEqual(self._count_activities("site_visit"), 1)

        enroll_response = self.client.post("/api/v1/enrollments", headers=headers, json={"courseId": 1})
        self.assertEqual(enroll_response.status_code, 200, enroll_response.text)
        enrollment_id = enroll_response.json()["id"]

        progress_response = self.client.patch(
            f"/api/v1/enrollments/{enrollment_id}/progress",
            headers=headers,
            json={"progressPercent": 40},
        )
        self.assertEqual(progress_response.status_code, 200, progress_response.text)

        note_response = self.client.post(
            "/api/v1/notes",
            headers=headers,
            json={"courseId": 1, "content": "Повторить параметры и производную"},
        )
        self.assertEqual(note_response.status_code, 201, note_response.text)

        ai_response = self.client.post(
            "/api/v1/ai/ask",
            headers=headers,
            json={"courseId": 1, "message": "Составь план повторения по производной"},
        )
        self.assertEqual(ai_response.status_code, 200, ai_response.text)

        pulse_response = self.client.get("/api/v1/user/pulse", headers=headers)
        self.assertEqual(pulse_response.status_code, 200, pulse_response.text)
        payload = pulse_response.json()

        self.assertGreaterEqual(payload["today"]["siteVisits"], 1)
        self.assertGreaterEqual(payload["today"]["activityCount"], 4)
        self.assertGreaterEqual(payload["today"]["readiness"], 30)
        self.assertEqual(payload["today"]["weakestTopic"], "Алгебра интенсив")
        self.assertGreaterEqual(payload["today"]["streakDays"], 1)
        self.assertEqual(len(payload["today"]["chart"]), 8)
        self.assertGreaterEqual(len(payload["today"]["plan"]), 1)

    def test_progress_update_counts_as_single_action_in_pulse(self) -> None:
        headers = self._register()

        enroll_response = self.client.post("/api/v1/enrollments", headers=headers, json={"courseId": 1})
        self.assertEqual(enroll_response.status_code, 200, enroll_response.text)
        enrollment_id = enroll_response.json()["id"]

        pulse_after_enroll = self.client.get("/api/v1/user/pulse", headers=headers)
        self.assertEqual(pulse_after_enroll.status_code, 200, pulse_after_enroll.text)
        base_actions = pulse_after_enroll.json()["today"]["activityCount"]

        progress_response = self.client.patch(
            f"/api/v1/enrollments/{enrollment_id}/progress",
            headers=headers,
            json={"progressPercent": 34},
        )
        self.assertEqual(progress_response.status_code, 200, progress_response.text)

        pulse_after_progress = self.client.get("/api/v1/user/pulse", headers=headers)
        self.assertEqual(pulse_after_progress.status_code, 200, pulse_after_progress.text)
        self.assertEqual(pulse_after_progress.json()["today"]["activityCount"], base_actions + 1)

    def test_each_login_is_counted_as_separate_site_visit(self) -> None:
        self._register()

        first_login = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "pulse@example.com",
                "password": "student123",
            },
        )
        self.assertEqual(first_login.status_code, 200, first_login.text)

        second_login = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "pulse@example.com",
                "password": "student123",
            },
        )
        self.assertEqual(second_login.status_code, 200, second_login.text)

        headers = {"Authorization": f"Bearer {second_login.json()['accessToken']}"}
        pulse_response = self.client.get("/api/v1/user/pulse", headers=headers)
        self.assertEqual(pulse_response.status_code, 200, pulse_response.text)
        self.assertGreaterEqual(pulse_response.json()["today"]["siteVisits"], 3)


if __name__ == "__main__":
    unittest.main()
