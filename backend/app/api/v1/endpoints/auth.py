from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import AuthContext, get_current_auth_context
from app.core.audit import log_audit_event
from app.core.auth_cookies import clear_auth_cookies, set_auth_cookies
from app.core.config import settings
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
    logout_session,
    refresh_tokens,
    register_user,
    request_password_reset,
)

router = APIRouter()


def _client_meta(request: Request) -> tuple[str, str]:
    return request.headers.get("user-agent", ""), request.client.host if request.client else ""


def _resolve_refresh_token(payload: RefreshTokenRequest | None, request: Request) -> str:
    body_token = payload.refresh_token.strip() if payload is not None else ""
    cookie_token = request.cookies.get(settings.refresh_cookie_name, "").strip()
    return body_token or cookie_token


@router.post("/register", response_model=TokenPairResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    tokens = register_user(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    set_auth_cookies(response, tokens)
    log_audit_event(
        event="auth.register",
        actor_email=payload.email.strip().lower(),
        request=request,
    )
    return tokens


@router.post("/login", response_model=TokenPairResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    tokens = authenticate_user(
        db,
        email=payload.email,
        password=payload.password,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    set_auth_cookies(response, tokens)
    log_audit_event(
        event="auth.login",
        actor_email=payload.email.strip().lower(),
        request=request,
    )
    return tokens


@router.post("/refresh", response_model=TokenPairResponse)
def refresh(
    request: Request,
    response: Response,
    payload: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    tokens = refresh_tokens(
        db,
        refresh_token=_resolve_refresh_token(payload, request),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    set_auth_cookies(response, tokens)
    log_audit_event(
        event="auth.refresh",
        request=request,
    )
    return tokens


@router.post("/change-password", response_model=TokenPairResponse)
def update_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    user_agent, ip_address = _client_meta(request)
    tokens = change_password(
        db,
        user=auth.user,
        current_password=payload.current_password,
        new_password=payload.new_password,
        current_session_id=auth.session.id,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    set_auth_cookies(response, tokens)
    log_audit_event(
        event="auth.change_password",
        actor_id=auth.user.id,
        actor_email=auth.user.email,
        request=request,
    )
    return tokens


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> MessageResponse:
    logout_session(db, session=auth.session)
    clear_auth_cookies(response)
    log_audit_event(
        event="auth.logout",
        actor_id=auth.user.id,
        actor_email=auth.user.email,
        request=request,
    )
    return MessageResponse(message="Сессия завершена")


@router.post("/password-reset/request", response_model=PasswordResetRequestResponse)
def create_password_reset(
    payload: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> PasswordResetRequestResponse:
    result = request_password_reset(db, email=payload.email)
    log_audit_event(
        event="auth.password_reset_request",
        actor_email=payload.email.strip().lower(),
        request=request,
    )
    return result


@router.post("/password-reset/confirm", response_model=MessageResponse)
def apply_password_reset(
    payload: PasswordResetConfirmRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MessageResponse:
    confirm_password_reset(db, token=payload.token, new_password=payload.new_password)
    log_audit_event(
        event="auth.password_reset_confirm",
        request=request,
    )
    return MessageResponse(message="Пароль успешно обновлен")
