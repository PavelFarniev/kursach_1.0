from __future__ import annotations

from fastapi import Response

from app.core.config import settings
from app.schemas.auth import TokenPairResponse


def _cookie_domain() -> str | None:
    return settings.auth_cookie_domain or None


def set_auth_cookies(response: Response, tokens: TokenPairResponse) -> None:
    response.set_cookie(
        key=settings.access_cookie_name,
        value=tokens.access_token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=_cookie_domain(),
        path="/",
    )
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=tokens.refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=_cookie_domain(),
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=settings.access_cookie_name,
        domain=_cookie_domain(),
        path="/",
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
    )
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        domain=_cookie_domain(),
        path="/",
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
    )
