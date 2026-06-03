from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

import httpx

from AIagent.gigachat_agent import ask_course_agent
from app.core.gigachat_credentials import (
    InvalidGigaChatCredentialsError,
    validate_gigachat_credentials,
)


class GigaChatCredentialsTests(unittest.TestCase):
    def test_validate_credentials_strips_basic_prefix_and_whitespace(self) -> None:
        normalized = validate_gigachat_credentials(
            "  Authorization: Basic   Zm9vOmJhcg== \n"
        )

        self.assertEqual(normalized, "Zm9vOmJhcg==")

    def test_validate_credentials_rejects_non_base64_value(self) -> None:
        with self.assertRaises(InvalidGigaChatCredentialsError):
            validate_gigachat_credentials("Basic not-a-valid-key")

    def test_ask_course_agent_passes_normalized_credentials_to_sdk(self) -> None:
        captured_credentials: dict[str, str | None] = {}

        class FakeClient:
            def chat(self, prompt: str):
                self.last_prompt = prompt
                return SimpleNamespace(
                    choices=[
                        SimpleNamespace(
                            message=SimpleNamespace(content="Нормализованный ответ")
                        )
                    ]
                )

        class FakeContextManager:
            def __enter__(self) -> FakeClient:
                return FakeClient()

            def __exit__(self, exc_type, exc, tb) -> bool:
                return False

        def fake_factory(**kwargs):
            captured_credentials["credentials"] = kwargs.get("credentials")
            return FakeContextManager()

        fake_settings = SimpleNamespace(
            gigachat_scope="GIGACHAT_API_PERS",
            gigachat_model="GigaChat",
            gigachat_verify_ssl_certs=False,
            gigachat_ca_bundle_file="",
            gigachat_timeout=30.0,
        )

        def fake_import(name: str):
            if name == "app.core.config":
                return SimpleNamespace(settings=fake_settings)
            if name == "gigachat":
                return SimpleNamespace(GigaChat=fake_factory)
            raise AssertionError(f"Unexpected import: {name}")

        with patch("AIagent.gigachat_agent.import_module", side_effect=fake_import):
            answer = ask_course_agent(
                course_title="Алгебра интенсив",
                course_category="Математика",
                course_description="Подготовка к задачам с параметрами.",
                user_message="Объясни тему производной",
                history=[],
                gigachat_credentials=" Basic   Zm9vOmJhcg== \n",
            )

        self.assertEqual(answer, "Нормализованный ответ")
        self.assertEqual(captured_credentials["credentials"], "Zm9vOmJhcg==")

    def test_ask_course_agent_uses_local_fallback_on_timeout(self) -> None:
        class FakeClient:
            def chat(self, prompt: str):
                raise httpx.ConnectTimeout("ssl handshake timed out")

        class FakeContextManager:
            def __enter__(self) -> FakeClient:
                return FakeClient()

            def __exit__(self, exc_type, exc, tb) -> bool:
                return False

        fake_settings = SimpleNamespace(
            gigachat_scope="GIGACHAT_API_PERS",
            gigachat_model="GigaChat",
            gigachat_verify_ssl_certs=False,
            gigachat_ca_bundle_file="",
            gigachat_timeout=30.0,
        )

        def fake_import(name: str):
            if name == "app.core.config":
                return SimpleNamespace(settings=fake_settings)
            if name == "gigachat":
                return SimpleNamespace(GigaChat=lambda **kwargs: FakeContextManager())
            raise AssertionError(f"Unexpected import: {name}")

        with patch("AIagent.gigachat_agent.import_module", side_effect=fake_import):
            answer = ask_course_agent(
                course_title="Алгебра интенсив",
                course_category="Математика",
                course_description="Подготовка к задачам с параметрами.",
                user_message="Объясни тему производной",
                history=[],
                gigachat_credentials="Zm9vOmJhcg==",
            )

        self.assertIn("Хороший запрос по курсу", answer)


if __name__ == "__main__":
    unittest.main()
