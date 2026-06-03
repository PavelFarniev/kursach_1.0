from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.core.gigachat_credentials import validate_gigachat_credentials
from app.schemas.base import CamelModel


class UserProfileResponse(CamelModel):
    id: int
    email: EmailStr
    full_name: str
    is_admin: bool
    has_gigachat_credentials: bool = False


class GigaChatCredentialsUpdateRequest(CamelModel):
    credentials: str = Field(min_length=20, max_length=4000)

    @field_validator("credentials", mode="before")
    @classmethod
    def normalize_credentials(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        return validate_gigachat_credentials(value)


class GigaChatCredentialsStatusResponse(CamelModel):
    has_credentials: bool


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
