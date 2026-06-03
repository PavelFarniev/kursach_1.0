from base64 import urlsafe_b64encode
from hashlib import sha256

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _get_fernet() -> Fernet:
    key = urlsafe_b64encode(sha256(settings.jwt_secret_key.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_secret(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        return ""

    return _get_fernet().encrypt(normalized.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str | None) -> str:
    if not value:
        return ""

    try:
        return _get_fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return ""
    except Exception:  # noqa: BLE001
        return ""
