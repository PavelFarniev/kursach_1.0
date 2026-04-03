from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import AuthContext, get_current_auth_context
from app.core.db import get_db
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenPairResponse,
)
from app.services.auth_service import (
    authenticate_user,
    change_password,
    confirm_password_reset,
    refresh_tokens,
    register_user,
    request_password_reset,
)

router = APIRouter()


def _client_meta(request: Request) -> tuple[str, str]:
    return request.headers.get("user-agent", ""), request.client.host if request.client else ""


@router.post("/register", response_model=TokenPairResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    return register_user(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password,
        user_agent=user_agent,
        ip_address=ip_address,
    )


@router.post("/login", response_model=TokenPairResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    return authenticate_user(
        db,
        email=payload.email,
        password=payload.password,
        user_agent=user_agent,
        ip_address=ip_address,
    )


@router.post("/refresh", response_model=TokenPairResponse)
def refresh(payload: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    return refresh_tokens(db, refresh_token=payload.refresh_token, user_agent=user_agent, ip_address=ip_address)


@router.post("/change-password", response_model=TokenPairResponse)
def update_password(
    payload: ChangePasswordRequest,
    request: Request,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    return change_password(
        db,
        user=auth.user,
        current_password=payload.current_password,
        new_password=payload.new_password,
        current_session_id=auth.session.id,
        user_agent=user_agent,
        ip_address=ip_address,
    )


@router.post("/password-reset/request", response_model=PasswordResetRequestResponse)
def create_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)) -> PasswordResetRequestResponse:
    return request_password_reset(db, email=payload.email)


@router.post("/password-reset/confirm", response_model=MessageResponse)
def apply_password_reset(payload: PasswordResetConfirmRequest, db: Session = Depends(get_db)) -> MessageResponse:
    confirm_password_reset(db, token=payload.token, new_password=payload.new_password)
    return MessageResponse(message="Пароль успешно обновлен")
