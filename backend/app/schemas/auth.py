from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class RegisterRequest(CamelModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class RefreshTokenRequest(CamelModel):
    refresh_token: str = Field(min_length=10)


class ChangePasswordRequest(CamelModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class PasswordResetRequest(CamelModel):
    email: EmailStr


class PasswordResetConfirmRequest(CamelModel):
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=6, max_length=128)


class TokenPairResponse(CamelModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(CamelModel):
    message: str


class PasswordResetRequestResponse(MessageResponse):
    reset_token: str | None = None
