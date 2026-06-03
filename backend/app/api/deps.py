from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.config import settings
from app.core.db import get_db
from app.core.security import decode_token
from app.models.session import Session as UserSession
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    user: User
    session: UserSession
    access_token: str


def _utc(value):
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def get_current_auth_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthContext:
    bearer_token = (
        credentials.credentials
        if credentials is not None and credentials.scheme.lower() == "bearer"
        else ""
    )
    cookie_token = request.cookies.get(settings.access_cookie_name, "")
    access_token = bearer_token or cookie_token

    if not access_token:
        log_audit_event(
            event="auth.missing_credentials",
            status="denied",
            request=request,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется авторизация")

    try:
        payload = decode_token(access_token)
    except JWTError as exc:
        log_audit_event(
            event="auth.invalid_access_token",
            status="denied",
            request=request,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен") from exc

    if payload.get("type") != "access":
        log_audit_event(
            event="auth.invalid_token_type",
            status="denied",
            request=request,
            details={"received_type": payload.get("type")},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ожидался access token")

    user_id = int(payload.get("sub", 0))
    session_id = int(payload.get("sid", 0))

    user = db.get(User, user_id)
    session = db.get(UserSession, session_id)

    if user is None or not user.is_active:
        log_audit_event(
            event="auth.user_not_found",
            status="denied",
            actor_id=user_id,
            request=request,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")

    if session is None or session.user_id != user.id:
        log_audit_event(
            event="auth.session_not_found",
            status="denied",
            actor_id=user.id,
            actor_email=user.email,
            request=request,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия не найдена")

    now = datetime.now(timezone.utc)
    if session.revoked_at is not None or _utc(session.expires_at) <= now:
        log_audit_event(
            event="auth.session_expired",
            status="denied",
            actor_id=user.id,
            actor_email=user.email,
            request=request,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия истекла")

    return AuthContext(user=user, session=session, access_token=access_token)


def get_current_user(auth: AuthContext = Depends(get_current_auth_context)) -> User:
    return auth.user


def get_current_admin_user(
    request: Request,
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_admin:
        log_audit_event(
            event="auth.admin_access_denied",
            status="denied",
            actor_id=user.id,
            actor_email=user.email,
            request=request,
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Требуются права администратора")

    return user
