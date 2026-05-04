from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.services.activity_service import COURSE_ENROLL_EVENT, COURSE_PROGRESS_EVENT, track_activity


def _resolve_status(progress_percent: int) -> str:
    return "completed" if progress_percent >= 100 else "active"


def create_enrollment(db: Session, *, user: User, course_id: int) -> Enrollment:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден")

    existing = db.scalar(
        select(Enrollment)
        .where(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
        .options(selectinload(Enrollment.course))
    )
    if existing is not None:
        return existing

    enrollment = Enrollment(user_id=user.id, course_id=course_id, progress_percent=0, status="active")
    db.add(enrollment)
    db.flush()
    track_activity(db, user_id=user.id, course_id=course_id, event_type=COURSE_ENROLL_EVENT)
    db.commit()

    return db.scalar(
        select(Enrollment).where(Enrollment.id == enrollment.id).options(selectinload(Enrollment.course))
    )


def list_user_enrollments(db: Session, *, user: User) -> list[Enrollment]:
    statement = (
        select(Enrollment)
        .where(Enrollment.user_id == user.id)
        .options(selectinload(Enrollment.course))
        .order_by(Enrollment.id.asc())
    )
    return list(db.scalars(statement))


def update_enrollment_progress(
    db: Session,
    *,
    user: User,
    enrollment_id: int,
    progress_percent: int,
) -> Enrollment:
    enrollment = db.scalar(
        select(Enrollment)
        .where(Enrollment.id == enrollment_id, Enrollment.user_id == user.id)
        .options(selectinload(Enrollment.course))
    )

    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись о прохождении курса не найдена")

    next_progress = max(0, min(100, progress_percent))
    delta = next_progress - enrollment.progress_percent
    enrollment.progress_percent = next_progress
    enrollment.status = _resolve_status(enrollment.progress_percent)

    if delta > 0:
        track_activity(
            db,
            user_id=user.id,
            course_id=enrollment.course_id,
            event_type=COURSE_PROGRESS_EVENT,
            value=delta,
        )

    db.commit()
    db.refresh(enrollment)

    return db.scalar(
        select(Enrollment).where(Enrollment.id == enrollment.id).options(selectinload(Enrollment.course))
    )
