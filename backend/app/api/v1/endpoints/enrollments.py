from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.schemas.enrollment import (
    EnrollmentCreateRequest,
    EnrollmentProgressPatchRequest,
    EnrollmentWithCourseResponse,
)
from app.services.enrollment_service import create_enrollment, list_user_enrollments, update_enrollment_progress

router = APIRouter()


@router.post("", response_model=EnrollmentWithCourseResponse)
def create_user_enrollment(
    payload: EnrollmentCreateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EnrollmentWithCourseResponse:
    enrollment = create_enrollment(db, user=user, course_id=payload.course_id)
    return EnrollmentWithCourseResponse.model_validate(enrollment)


@router.get("/my", response_model=list[EnrollmentWithCourseResponse])
def get_my_enrollments(user=Depends(get_current_user), db: Session = Depends(get_db)) -> list[EnrollmentWithCourseResponse]:
    enrollments = list_user_enrollments(db, user=user)
    return [EnrollmentWithCourseResponse.model_validate(enrollment) for enrollment in enrollments]


@router.patch("/{enrollment_id}/progress", response_model=EnrollmentWithCourseResponse)
def update_progress(
    enrollment_id: int,
    payload: EnrollmentProgressPatchRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EnrollmentWithCourseResponse:
    enrollment = update_enrollment_progress(db, user=user, enrollment_id=enrollment_id, progress_percent=payload.progress_percent)
    return EnrollmentWithCourseResponse.model_validate(enrollment)
