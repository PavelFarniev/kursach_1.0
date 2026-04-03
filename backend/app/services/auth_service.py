from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.password_reset import PasswordReset
from app.models.session import Session as UserSession
from app.models.user import User
from app.schemas.auth import PasswordResetRequestResponse, TokenPairResponse
from app.schemas.user import UserProfileResponse

DEMO_EMAIL = "demo@student.ai"
DEMO_PASSWORD = "demo123"
DEMO_FULL_NAME = "Demo Student"


def serialize_user_profile(user: User) -> UserProfileResponse:
    return UserProfileResponse(id=user.id, email=user.email, full_name=user.full_name, is_admin=user.is_admin)


def _unauthorized(message: str = "Требуется авторизация") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)


def _refresh_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def _create_token_pair_for_session(
    db: Session,
    user: User,
    session: UserSession,
    *,
    user_agent: str = "",
    ip_address: str = "",
) -> TokenPairResponse:
    access_token = create_access_token(str(user.id), session.id)
    refresh_token = create_refresh_token(str(user.id), session.id)

    session.refresh_token_hash = hash_token(refresh_token)
    session.expires_at = _refresh_expiry()
    session.revoked_at = None
    session.user_agent = user_agent[:255]
    session.ip_address = ip_address[:45]

    db.add(session)
    db.commit()
    db.refresh(session)

    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token)


def create_session_tokens(
    db: Session,
    user: User,
    *,
    user_agent: str = "",
    ip_address: str = "",
) -> TokenPairResponse:
    session = UserSession(
        user_id=user.id,
        refresh_token_hash="pending",
        expires_at=_refresh_expiry(),
        user_agent=user_agent[:255],
        ip_address=ip_address[:45],
    )
    db.add(session)
    db.flush()
    return _create_token_pair_for_session(db, user, session, user_agent=user_agent, ip_address=ip_address)


def register_user(
    db: Session,
    *,
    email: str,
    full_name: str,
    password: str,
    user_agent: str = "",
    ip_address: str = "",
) -> TokenPairResponse:
    normalized_email = email.strip().lower()
    existing = db.scalar(select(User).where(func.lower(User.email) == normalized_email))

    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь с таким email уже существует")

    user = User(
        email=normalized_email,
        full_name=full_name.strip(),
        password_hash=hash_password(password),
    )
    db.add(user)
    db.flush()

    return create_session_tokens(db, user, user_agent=user_agent, ip_address=ip_address)


def authenticate_user(
    db: Session,
    *,
    email: str,
    password: str,
    user_agent: str = "",
    ip_address: str = "",
) -> TokenPairResponse:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.email) == normalized_email))

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Аккаунт деактивирован")

    return create_session_tokens(db, user, user_agent=user_agent, ip_address=ip_address)


def refresh_tokens(
    db: Session,
    *,
    refresh_token: str,
    user_agent: str = "",
    ip_address: str = "",
) -> TokenPairResponse:
    try:
        payload = decode_token(refresh_token)
    except Exception as exc:  # noqa: BLE001
        raise _unauthorized("Недействительный refresh token") from exc

    if payload.get("type") != "refresh":
        raise _unauthorized("Ожидался refresh token")

    session_id = int(payload.get("sid", 0))
    user_id = int(payload.get("sub", 0))
    session = db.get(UserSession, session_id)

    if session is None or session.user_id != user_id:
        raise _unauthorized("Сессия не найдена")

    if session.revoked_at is not None or _utc(session.expires_at) <= datetime.now(timezone.utc):
        raise _unauthorized("Сессия истекла")

    if session.refresh_token_hash != hash_token(refresh_token):
        raise _unauthorized("Refresh token отозван")

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _unauthorized()

    return _create_token_pair_for_session(db, user, session, user_agent=user_agent, ip_address=ip_address)


def change_password(
    db: Session,
    *,
    user: User,
    current_password: str,
    new_password: str,
    current_session_id: int,
    user_agent: str = "",
    ip_address: str = "",
) -> TokenPairResponse:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Текущий пароль указан неверно")

    if current_password == new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Новый пароль должен отличаться от текущего")

    user.password_hash = hash_password(new_password)
    now = datetime.now(timezone.utc)

    active_sessions = list(db.scalars(select(UserSession).where(UserSession.user_id == user.id)))
    current_session = None

    for session in active_sessions:
        if session.id == current_session_id:
            current_session = session
            continue
        session.revoked_at = now

    if current_session is None:
        raise _unauthorized("Текущая сессия не найдена")

    active_resets = list(
        db.scalars(
            select(PasswordReset).where(
                PasswordReset.user_id == user.id,
                PasswordReset.is_used.is_(False),
            )
        )
    )
    for reset in active_resets:
        reset.is_used = True

    return _create_token_pair_for_session(db, user, current_session, user_agent=user_agent, ip_address=ip_address)


def request_password_reset(db: Session, *, email: str) -> PasswordResetRequestResponse:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    generic_message = "Если пользователь существует, инструкция по смене пароля уже подготовлена."

    if user is None:
        return PasswordResetRequestResponse(message=generic_message)

    raw_token = create_password_reset_token()
    reset_record = PasswordReset(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes),
    )
    db.add(reset_record)
    db.commit()

    should_return_token = settings.app_env != "prod"
    return PasswordResetRequestResponse(message=generic_message, reset_token=raw_token if should_return_token else None)


def confirm_password_reset(db: Session, *, token: str, new_password: str) -> None:
    token_hash = hash_token(token)
    reset_record = db.scalar(
        select(PasswordReset).where(
            PasswordReset.token_hash == token_hash,
            PasswordReset.is_used.is_(False),
        )
    )

    if reset_record is None or _utc(reset_record.expires_at) <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Токен сброса недействителен или истек")

    user = db.get(User, reset_record.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.password_hash = hash_password(new_password)
    reset_record.is_used = True
    now = datetime.now(timezone.utc)

    user_sessions = list(db.scalars(select(UserSession).where(UserSession.user_id == user.id)))
    for session in user_sessions:
        session.revoked_at = now

    db.commit()


def seed_demo_data(db: Session) -> None:
    demo_user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    if demo_user is None:
        demo_user = User(
            email=DEMO_EMAIL,
            full_name=DEMO_FULL_NAME,
            password_hash=hash_password(DEMO_PASSWORD),
        )
        db.add(demo_user)
        db.flush()

    demo_user.is_admin = True
    demo_user.is_active = True

    courses = list(db.scalars(select(Course).order_by(Course.id.asc())))
    if len(courses) >= 4:
        course_ids = {courses[1].id, courses[3].id}
        existing_course_ids = set(
            db.scalars(select(Enrollment.course_id).where(Enrollment.user_id == demo_user.id, Enrollment.course_id.in_(course_ids)))
        )

        if courses[1].id not in existing_course_ids:
            db.add(
                Enrollment(
                    user_id=demo_user.id,
                    course_id=courses[1].id,
                    progress_percent=45,
                    status="active",
                )
            )

        if courses[3].id not in existing_course_ids:
            db.add(
                Enrollment(
                    user_id=demo_user.id,
                    course_id=courses[3].id,
                    progress_percent=100,
                    status="completed",
                )
            )

    db.commit()
