from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_activity import UserActivity

SITE_VISIT_EVENT = "site_visit"
COURSE_ENROLL_EVENT = "course_enroll"
COURSE_PROGRESS_EVENT = "course_progress"


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def track_activity(
    db: Session,
    *,
    user_id: int,
    event_type: str,
    course_id: int | None = None,
    value: int = 1,
    dedupe_window: timedelta | None = None,
) -> UserActivity | None:
    if dedupe_window is not None:
        latest = db.scalar(
            select(UserActivity)
            .where(
                UserActivity.user_id == user_id,
                UserActivity.event_type == event_type,
                UserActivity.course_id == course_id,
            )
            .order_by(UserActivity.created_at.desc(), UserActivity.id.desc())
            .limit(1)
        )

        if latest is not None:
            cutoff = datetime.now(timezone.utc) - dedupe_window
            if _utc(latest.created_at) >= cutoff:
                return None

    activity = UserActivity(
        user_id=user_id,
        course_id=course_id,
        event_type=event_type,
        value=value,
    )
    db.add(activity)
    return activity


def track_site_visit(db: Session, *, user: User) -> UserActivity | None:
    # One visit per 30 minutes is enough to capture actual entrances without noise from repeated bootstrap calls.
    return track_activity(
        db,
        user_id=user.id,
        event_type=SITE_VISIT_EVENT,
        dedupe_window=timedelta(minutes=30),
    )
