from fastapi import APIRouter

from app.schemas.auth import LoginRequest, RegisterRequest, TokenPairResponse

router = APIRouter()


@router.post("/register", response_model=TokenPairResponse)
def register(_: RegisterRequest) -> TokenPairResponse:
    return TokenPairResponse(access_token="planned", refresh_token="planned")


@router.post("/login", response_model=TokenPairResponse)
def login(_: LoginRequest) -> TokenPairResponse:
    return TokenPairResponse(access_token="planned", refresh_token="planned")


@router.post("/refresh", response_model=TokenPairResponse)
def refresh() -> TokenPairResponse:
    return TokenPairResponse(access_token="planned", refresh_token="planned")


@router.post("/password-reset/request")
def request_password_reset() -> dict[str, str]:
    return {"message": "planned"}


@router.post("/password-reset/confirm")
def confirm_password_reset() -> dict[str, str]:
    return {"message": "planned"}
