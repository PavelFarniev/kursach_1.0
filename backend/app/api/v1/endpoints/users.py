from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.audit import log_audit_event
from app.core.crypto import encrypt_secret
from app.core.db import get_db
from app.schemas.pulse import LearningPulseResponse
from app.schemas.user import (
    GigaChatCredentialsStatusResponse,
    GigaChatCredentialsUpdateRequest,
    UserProfileResponse,
)
from app.services.activity_service import track_site_visit
from app.services.auth_service import serialize_user_profile
from app.services.pulse_service import get_learning_pulse

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(
    user=Depends(get_current_user), db: Session = Depends(get_db)
) -> UserProfileResponse:
    activity = track_site_visit(db, user=user)
    if activity is not None:
        db.commit()

    return serialize_user_profile(user)


@router.get("/pulse", response_model=LearningPulseResponse)
def get_user_pulse(
    user=Depends(get_current_user), db: Session = Depends(get_db)
) -> LearningPulseResponse:
    return get_learning_pulse(db, user=user)


@router.get("/gigachat-credentials", response_model=GigaChatCredentialsStatusResponse)
def get_gigachat_credentials_status(
    user=Depends(get_current_user),
) -> GigaChatCredentialsStatusResponse:
    return GigaChatCredentialsStatusResponse(
        has_credentials=bool(user.gigachat_credentials_encrypted)
    )


@router.put("/gigachat-credentials", response_model=GigaChatCredentialsStatusResponse)
def update_gigachat_credentials(
    payload: GigaChatCredentialsUpdateRequest,
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GigaChatCredentialsStatusResponse:
    user.gigachat_credentials_encrypted = encrypt_secret(payload.credentials)
    db.add(user)
    db.commit()
    log_audit_event(
        event="user.gigachat_credentials.update",
        actor_id=user.id,
        actor_email=user.email,
        resource=f"user:{user.id}",
        request=request,
    )
    return GigaChatCredentialsStatusResponse(has_credentials=True)


@router.delete(
    "/gigachat-credentials", response_model=GigaChatCredentialsStatusResponse
)
def delete_gigachat_credentials(
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GigaChatCredentialsStatusResponse:
    user.gigachat_credentials_encrypted = None
    db.add(user)
    db.commit()
    log_audit_event(
        event="user.gigachat_credentials.delete",
        actor_id=user.id,
        actor_email=user.email,
        resource=f"user:{user.id}",
        request=request,
    )
    return GigaChatCredentialsStatusResponse(has_credentials=False)
