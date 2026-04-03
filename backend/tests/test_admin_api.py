from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.v1.router import api_router
from app.core.db import get_db
from app.models import Base
from app.models.ai_chat_message import AIChatMessage
from app.models.ai_chat_session import AIChatSession
from app.models.course import Course
from app.models.course_note import CourseNote
from app.models.course_slide import CourseSlide
from app.models.enrollment import Enrollment
from app.models.user import User
from app.services.auth_service import DEMO_EMAIL, DEMO_PASSWORD, seed_demo_data


class AdminApiSmokeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "test_admin_api.db"
        self.engine = create_engine(
            f"sqlite:///{self.database_path}",
            connect_args={"check_same_thread": False},
        )
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, expire_on_commit=False)
        Base.metadata.create_all(self.engine)
        self._seed_initial_data()

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
        self.engine.dispose()
        self.temp_dir.cleanup()

    def _seed_initial_data(self) -> None:
        starter_courses = [
            ("Алгебра интенсив", "Математика", "Advanced"),
            ("Русский база", "Русский язык", "Intermediate"),
            ("Физика шаг за шагом", "Физика", "Beginner"),
            ("Общество sprint", "Обществознание", "Intermediate"),
            ("IELTS sprint", "Английский", "Advanced"),
        ]

        with self.SessionLocal() as db:
            for index, (title, category, level) in enumerate(starter_courses):
                course = Course(
                    title=title,
                    description=f"Описание курса {title}",
                    category=category,
                    level=level,
                    lessons_count=12 + index,
                    estimated_hours=18 + index,
                )
                db.add(course)
                db.flush()

                db.add_all(
                    [
                        CourseSlide(
                            course_id=course.id,
                            order_index=slide_index,
                            title=f"{title} / Слайд {slide_index + 1}",
                            summary=f"Краткое описание {slide_index + 1}",
                            theory_blocks=[f"Теория {slide_index + 1}.1", f"Теория {slide_index + 1}.2"],
                            bullets=[f"Тезис {slide_index + 1}.1", f"Тезис {slide_index + 1}.2"],
                            example=f"Пример {slide_index + 1}",
                            practice_task=f"Практика {slide_index + 1}",
                        )
                        for slide_index in range(3)
                    ]
                )

            db.commit()
            seed_demo_data(db)

    def _login(self, email: str, password: str) -> dict[str, str]:
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": email,
                "password": password,
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        access_token = response.json()["accessToken"]
        return {"Authorization": f"Bearer {access_token}"}

    def _register_regular_user(self, email: str = "student@example.com") -> dict[str, str]:
        response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "fullName": "Regular Student",
                "password": "student123",
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        access_token = response.json()["accessToken"]
        return {"Authorization": f"Bearer {access_token}"}

    def _count_rows(self, model) -> int:
        with self.SessionLocal() as db:
            return db.scalar(select(func.count()).select_from(model)) or 0

    def _course_by_title(self, title: str) -> Course:
        with self.SessionLocal() as db:
            course = db.scalar(select(Course).where(Course.title == title))

        self.assertIsNotNone(course)
        return course

    def test_non_admin_gets_403_for_admin_courses(self) -> None:
        headers = self._register_regular_user()

        response = self.client.get("/api/v1/admin/courses", headers=headers)

        self.assertEqual(response.status_code, 403)

    def test_admin_can_list_and_search_courses(self) -> None:
        headers = self._login(DEMO_EMAIL, DEMO_PASSWORD)

        response = self.client.get("/api/v1/admin/courses", headers=headers)
        self.assertEqual(response.status_code, 200, response.text)
        courses = response.json()
        self.assertEqual(len(courses), 5)

        course_id = courses[0]["id"]
        course_title = courses[0]["title"]
        course_category = courses[0]["category"]
        course_level = courses[0]["level"]

        for query in (str(course_id), course_title, course_category, course_level):
            search_response = self.client.get("/api/v1/admin/courses", headers=headers, params={"search": query})
            self.assertEqual(search_response.status_code, 200, search_response.text)
            self.assertGreaterEqual(len(search_response.json()), 1)

    def test_admin_course_requires_at_least_one_slide(self) -> None:
        headers = self._login(DEMO_EMAIL, DEMO_PASSWORD)

        response = self.client.post(
            "/api/v1/admin/courses",
            headers=headers,
            json={
                "title": "Новый курс",
                "description": "Описание курса",
                "category": "Информатика",
                "level": "Beginner",
                "lessonsCount": 6,
                "estimatedHours": 8,
                "slides": [],
            },
        )

        self.assertEqual(response.status_code, 422)

    def test_admin_can_create_update_and_publish_course_slides(self) -> None:
        headers = self._login(DEMO_EMAIL, DEMO_PASSWORD)

        create_response = self.client.post(
            "/api/v1/admin/courses",
            headers=headers,
            json={
                "title": "Python для ЕГЭ",
                "description": "Стартовый курс по Python",
                "category": "Информатика",
                "level": "Beginner",
                "lessonsCount": 10,
                "estimatedHours": 14,
                "slides": [
                    {
                        "orderIndex": 1,
                        "title": "Практика сначала",
                        "summary": "Слайд для проверки сортировки",
                        "theoryBlocks": ["Теория Б1", "Теория Б2"],
                        "bullets": ["Пункт Б1", "Пункт Б2"],
                        "example": "Пример Б",
                        "practiceTask": "Практика Б",
                    },
                    {
                        "orderIndex": 0,
                        "title": "Введение в Python",
                        "summary": "Базовые идеи курса",
                        "theoryBlocks": ["Теория А1", "Теория А2"],
                        "bullets": ["Пункт А1", "Пункт А2"],
                        "example": "Пример А",
                        "practiceTask": "Практика А",
                    },
                ],
            },
        )
        self.assertEqual(create_response.status_code, 201, create_response.text)
        created_course = create_response.json()
        self.assertEqual(created_course["slides"][0]["title"], "Введение в Python")
        self.assertEqual(created_course["slides"][0]["orderIndex"], 0)

        course_id = created_course["id"]
        update_response = self.client.patch(
            f"/api/v1/admin/courses/{course_id}",
            headers=headers,
            json={
                "title": "Python для ЕГЭ 2.0",
                "description": "Обновленный курс по Python",
                "category": "Информатика",
                "level": "Intermediate",
                "lessonsCount": 12,
                "estimatedHours": 16,
                "slides": [
                    {
                        "orderIndex": 0,
                        "title": "Новый старт",
                        "summary": "Первый слайд после обновления",
                        "theoryBlocks": ["Новая теория 1", "Новая теория 2"],
                        "bullets": ["Новый тезис 1", "Новый тезис 2"],
                        "example": "Новый пример 1",
                        "practiceTask": "Новая практика 1",
                    },
                    {
                        "orderIndex": 1,
                        "title": "Второй шаг",
                        "summary": "Продолжение курса",
                        "theoryBlocks": ["Вторая теория 1", "Вторая теория 2"],
                        "bullets": ["Второй тезис 1", "Второй тезис 2"],
                        "example": "Новый пример 2",
                        "practiceTask": "Новая практика 2",
                    },
                ],
            },
        )

        self.assertEqual(update_response.status_code, 200, update_response.text)
        updated_course = update_response.json()
        self.assertEqual(updated_course["title"], "Python для ЕГЭ 2.0")
        self.assertEqual([slide["orderIndex"] for slide in updated_course["slides"]], [0, 1])
        self.assertEqual([slide["title"] for slide in updated_course["slides"]], ["Новый старт", "Второй шаг"])

        public_response = self.client.get(f"/api/v1/courses/{course_id}")
        self.assertEqual(public_response.status_code, 200, public_response.text)
        public_course = public_response.json()
        self.assertEqual(public_course["slides"][0]["title"], "Новый старт")
        self.assertIsInstance(public_course["slides"][0]["id"], str)

    def test_delete_course_cascades_related_records(self) -> None:
        admin_headers = self._login(DEMO_EMAIL, DEMO_PASSWORD)
        self._register_regular_user("cascade@example.com")
        course = self._course_by_title("Алгебра интенсив")

        with self.SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == "cascade@example.com"))
            self.assertIsNotNone(user)

            db.add(Enrollment(user_id=user.id, course_id=course.id, progress_percent=55, status="active"))
            db.add(CourseNote(user_id=user.id, course_id=course.id, content="Важная заметка"))
            chat_session = AIChatSession(user_id=user.id, course_id=course.id, title="Разбор задач")
            db.add(chat_session)
            db.flush()
            db.add(AIChatMessage(chat_session_id=chat_session.id, role="user", content="Почему так?"))
            db.commit()

        delete_response = self.client.delete(f"/api/v1/admin/courses/{course.id}", headers=admin_headers)
        self.assertEqual(delete_response.status_code, 204, delete_response.text)

        with self.SessionLocal() as db:
            self.assertIsNone(db.get(Course, course.id))
            self.assertEqual(db.scalar(select(func.count()).select_from(CourseSlide).where(CourseSlide.course_id == course.id)), 0)
            self.assertEqual(db.scalar(select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course.id)), 0)
            self.assertEqual(db.scalar(select(func.count()).select_from(CourseNote).where(CourseNote.course_id == course.id)), 0)
            self.assertEqual(
                db.scalar(select(func.count()).select_from(AIChatSession).where(AIChatSession.course_id == course.id)),
                0,
            )
            self.assertEqual(db.scalar(select(func.count()).select_from(AIChatMessage)), 0)

    def test_demo_profile_is_admin(self) -> None:
        headers = self._login(DEMO_EMAIL, DEMO_PASSWORD)

        response = self.client.get("/api/v1/user/profile", headers=headers)

        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["isAdmin"])


if __name__ == "__main__":
    unittest.main()
