from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import AdminUserResponse, AdminUserUpdateRequest


def serialize_admin_user(user: User) -> AdminUserResponse:
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def list_admin_users(db: Session, *, search: str = "") -> list[User]:
    stmt = select(User).order_by(User.is_admin.desc(), User.created_at.desc(), User.id.desc())
    users = list(db.scalars(stmt))
    normalized_search = search.strip().casefold()

    if not normalized_search:
        return users

    matched_users: list[User] = []
    search_id = int(normalized_search) if normalized_search.isdigit() else None

    for user in users:
        if search_id is not None and user.id == search_id:
            matched_users.append(user)
            continue

        if normalized_search in user.email.casefold() or normalized_search in user.full_name.casefold():
            matched_users.append(user)

    return matched_users


def update_admin_user(
    db: Session,
    *,
    current_admin: User,
    user_id: int,
    payload: AdminUserUpdateRequest,
) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    if payload.email is not None:
        normalized_email = payload.email.strip().lower()

        if not normalized_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email не может быть пустым")

        existing = db.scalar(select(User).where(func.lower(User.email) == normalized_email, User.id != user.id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь с таким email уже существует")

        user.email = normalized_email

    if payload.full_name is not None:
        normalized_full_name = payload.full_name.strip()
        if len(normalized_full_name) < 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Имя должно содержать минимум 2 символа")

        user.full_name = normalized_full_name

    if payload.is_active is not None:
        if current_admin.id == user.id and not payload.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя деактивировать текущего администратора")

        user.is_active = payload.is_active

    if payload.is_admin is not None:
        if current_admin.id == user.id and not payload.is_admin:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя снять права администратора у текущего пользователя")

        user.is_admin = payload.is_admin

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_admin_user(db: Session, *, current_admin: User, user_id: int) -> None:
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    if current_admin.id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя удалить текущего администратора")

    db.delete(user)
    db.commit()
