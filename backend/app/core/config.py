from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "KillExam API"
    app_env: str = "dev"
    database_url: str = "postgresql+psycopg://postgres@127.0.0.1:5432/killexam"
    jwt_secret_key: str = "change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    password_reset_expire_minutes: int = 30
    access_cookie_name: str = "killexam_access_token"
    refresh_cookie_name: str = "killexam_refresh_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    auth_cookie_domain: str = ""
    openai_api_key: str = ""
    gigachat_credentials: str = ""
    gigachat_access_token: str = ""
    gigachat_scope: str = "GIGACHAT_API_PERS"
    gigachat_model: str = "GigaChat"
    gigachat_verify_ssl_certs: bool = True
    gigachat_ca_bundle_file: str = ""
    gigachat_timeout: float = 30.0
    audit_log_path: Path = BACKEND_DIR / "runtime_logs" / "audit.log"
    audit_log_max_bytes: int = 2_000_000
    audit_log_backup_count: int = 5
    response_time_warning_ms: float = 750.0
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    model_config = SettingsConfigDict(
        env_file=(".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
    )


settings = Settings()
