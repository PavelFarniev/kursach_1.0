from fastapi import APIRouter

from app.schemas.user import UserProfileResponse

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
def get_profile() -> UserProfileResponse:
    return UserProfileResponse(id=0, email="planned@example.com", full_name="Planned User", is_active=True)
