from __future__ import annotations

import time
import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.router import api_router
from app.core.db import get_db
from app.models.course import Course
from tests.postgres_test_harness import PostgresTestDatabase


class ResponseTimeApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_db = PostgresTestDatabase()
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
                        description="Практика параметров и производной.",
                        category="Математика",
                        level="Advanced",
                        lessons_count=20,
                        estimated_hours=30,
                    ),
                    Course(
                        title="Русский база",
                        description="Подготовка к сочинению.",
                        category="Русский язык",
                        level="Intermediate",
                        lessons_count=18,
                        estimated_hours=24,
                    ),
                ]
            )
            db.commit()

    def test_courses_list_responds_within_reasonable_time(self) -> None:
        started_at = time.perf_counter()
        response = self.client.get("/api/v1/courses")
        duration = time.perf_counter() - started_at

        self.assertEqual(response.status_code, 200, response.text)
        self.assertLess(
            duration,
            2.0,
            f"GET /api/v1/courses exceeded expected response time: {duration:.3f}s",
        )

    def test_auth_login_responds_within_reasonable_time(self) -> None:
        register_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "speed@example.com",
                "fullName": "Speed Student",
                "password": "student123",
            },
        )
        self.assertEqual(register_response.status_code, 201, register_response.text)

        started_at = time.perf_counter()
        login_response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "speed@example.com",
                "password": "student123",
            },
        )
        duration = time.perf_counter() - started_at

        self.assertEqual(login_response.status_code, 200, login_response.text)
        self.assertLess(
            duration,
            2.0,
            f"POST /api/v1/auth/login exceeded expected response time: {duration:.3f}s",
        )


if __name__ == "__main__":
    unittest.main()
