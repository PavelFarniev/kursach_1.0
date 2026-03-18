from fastapi import APIRouter

from app.schemas.enrollment import (
    EnrollmentCreateRequest,
    EnrollmentProgressPatchRequest,
    EnrollmentResponse,
)

router = APIRouter()


@router.post("", response_model=EnrollmentResponse)
def create_enrollment(payload: EnrollmentCreateRequest) -> EnrollmentResponse:
    return EnrollmentResponse(
        id=0,
        user_id=0,
        course_id=payload.course_id,
        progress_percent=0,
        status="active",
    )


@router.get("/my", response_model=list[EnrollmentResponse])
def list_my_enrollments() -> list[EnrollmentResponse]:
    return []


@router.patch("/{enrollment_id}/progress", response_model=EnrollmentResponse)
def update_progress(enrollment_id: int, payload: EnrollmentProgressPatchRequest) -> EnrollmentResponse:
    return EnrollmentResponse(
        id=enrollment_id,
        user_id=0,
        course_id=0,
        progress_percent=payload.progress_percent,
        status="active" if payload.progress_percent < 100 else "completed",
    )
