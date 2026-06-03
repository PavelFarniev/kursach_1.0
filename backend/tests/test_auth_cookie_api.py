from __future__ import annotations

import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.router import api_router
from app.core.db import get_db
from tests.postgres_test_harness import PostgresTestDatabase


class AuthCookieApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_db = PostgresTestDatabase()
        self.SessionLocal = self.test_db.SessionLocal

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

    def test_register_sets_http_only_auth_cookies(self) -> None:
        response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "cookie@example.com",
                "fullName": "Cookie Student",
                "password": "student123",
            },
        )

        self.assertEqual(response.status_code, 201, response.text)
        set_cookie_header = response.headers.get("set-cookie", "")
        self.assertIn("killexam_access_token=", set_cookie_header)
        self.assertIn("killexam_refresh_token=", set_cookie_header)
        self.assertIn("HttpOnly", set_cookie_header)

    def test_logout_clears_cookie_session_and_revokes_access(self) -> None:
        register_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "logout@example.com",
                "fullName": "Logout Student",
                "password": "student123",
            },
        )
        self.assertEqual(register_response.status_code, 201, register_response.text)

        profile_before_logout = self.client.get("/api/v1/user/profile")
        self.assertEqual(profile_before_logout.status_code, 200, profile_before_logout.text)

        logout_response = self.client.post("/api/v1/auth/logout")
        self.assertEqual(logout_response.status_code, 200, logout_response.text)
        self.assertIn("Max-Age=0", logout_response.headers.get("set-cookie", ""))

        profile_after_logout = self.client.get("/api/v1/user/profile")
        self.assertEqual(profile_after_logout.status_code, 401, profile_after_logout.text)


if __name__ == "__main__":
    unittest.main()
