from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.schemas.pulse import LearningPulseResponse
from app.schemas.user import UserProfileResponse
from app.services.activity_service import track_site_visit
from app.services.auth_service import serialize_user_profile
from app.services.pulse_service import get_learning_pulse

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(user=Depends(get_current_user), db: Session = Depends(get_db)) -> UserProfileResponse:
    activity = track_site_visit(db, user=user)
    if activity is not None:
        db.commit()

    return serialize_user_profile(user)


@router.get("/pulse", response_model=LearningPulseResponse)
def get_user_pulse(user=Depends(get_current_user), db: Session = Depends(get_db)) -> LearningPulseResponse:
    return get_learning_pulse(db, user=user)
