from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class UserProfileResponse(CamelModel):
    id: int
    email: EmailStr
    full_name: str
    is_admin: bool


class AdminUserResponse(CamelModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime


class AdminUserUpdateRequest(CamelModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    is_active: bool | None = None
    is_admin: bool | None = None
