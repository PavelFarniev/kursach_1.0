from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.user import UserProfileResponse
from app.services.auth_service import serialize_user_profile

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(user=Depends(get_current_user)) -> UserProfileResponse:
    return serialize_user_profile(user)
