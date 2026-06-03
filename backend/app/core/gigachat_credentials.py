from __future__ import annotations

import base64
import binascii
import re

_AUTHORIZATION_PREFIX_RE = re.compile(r"^\s*authorization\s*:\s*", re.IGNORECASE)
_BASIC_PREFIX_RE = re.compile(r"^\s*basic\s+", re.IGNORECASE)


class InvalidGigaChatCredentialsError(ValueError):
    """Raised when a GigaChat Authorization Key is malformed."""


def normalize_gigachat_credentials(value: str) -> str:
    normalized = value.strip().strip('"').strip("'")
    if not normalized:
        return ""

    normalized = _AUTHORIZATION_PREFIX_RE.sub("", normalized, count=1)
    normalized = _BASIC_PREFIX_RE.sub("", normalized, count=1)
    return "".join(normalized.split())


def validate_gigachat_credentials(value: str) -> str:
    normalized = normalize_gigachat_credentials(value)
    if not normalized:
        raise InvalidGigaChatCredentialsError(
            "Введите корректный GigaChat Authorization Key."
        )

    try:
        base64.b64decode(normalized, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise InvalidGigaChatCredentialsError(
            "Введите корректный GigaChat Authorization Key в формате base64. "
            "Префикс Basic указывать не нужно."
        ) from exc

    return normalized
