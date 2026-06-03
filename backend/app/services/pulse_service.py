from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.ai_chat_message import AIChatMessage
from app.models.ai_chat_session import AIChatSession
from app.models.course_note import CourseNote
from app.models.enrollment import Enrollment
from app.models.user import User
from app.models.user_activity import UserActivity
from app.schemas.pulse import LearningPulseResponse, PulseSnapshotResponse
from app.services.activity_service import COURSE_ENROLL_EVENT, COURSE_PROGRESS_EVENT, SITE_VISIT_EVENT

LOCAL_TIMEZONE = datetime.now().astimezone().tzinfo or timezone.utc


@dataclass(frozen=True)
class PulsePeriod:
    key: str
    label: str
    bucket_count: int
    bucket_size: timedelta

    @property
    def window(self) -> timedelta:
        return self.bucket_size * self.bucket_count


PULSE_PERIODS = (
    PulsePeriod(key="today", label="Текущий день", bucket_count=8, bucket_size=timedelta(hours=3)),
    PulsePeriod(key="week", label="7 дней", bucket_count=7, bucket_size=timedelta(days=1)),
    PulsePeriod(key="sprint", label="Ближайшие 14 дней", bucket_count=14, bucket_size=timedelta(days=1)),
)


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def _to_local(value: datetime) -> datetime:
    return _utc(value).astimezone(LOCAL_TIMEZONE)


def _compute_readiness(enrollments: list[Enrollment]) -> int:
    if not enrollments:
        return 0

    average_progress = sum(item.progress_percent for item in enrollments) / len(enrollments)
    completed_share = sum(1 for item in enrollments if item.status == "completed") / len(enrollments)
    readiness = round(average_progress * 0.85 + completed_share * 15)
    return max(0, min(100, readiness))


def _weakest_topic(enrollments: list[Enrollment]) -> str:
    if not enrollments:
        return "Пока не определена"

    candidates = [item for item in enrollments if item.progress_percent < 100] or enrollments
    weakest = min(candidates, key=lambda item: (item.progress_percent, item.course_id))

    if weakest.course is None:
        return "Пока не определена"

    if len(weakest.course.title) <= 26:
        return weakest.course.title

    return weakest.course.category


def _build_plan(
    *,
    enrollments: list[Enrollment],
    weakest_topic: str,
    site_visits: int,
    notes_count: int,
    ai_questions_count: int,
    progress_events_count: int,
) -> list[str]:
    if not enrollments:
        return [
            "Выберите первый курс и откройте вводный блок, чтобы Pulse начал собирать вашу динамику.",
            "После первого входа возвращайтесь ежедневно: серия появится уже со второго дня.",
            "Фиксируйте заметки и задавайте вопросы в AI-чате, чтобы панель видела реальные учебные сигналы.",
        ]

    plan: list[str] = []
    weakest_enrollment = min(
        (item for item in enrollments if item.progress_percent < 100),
        key=lambda item: (item.progress_percent, item.course_id),
        default=None,
    )

    if weakest_enrollment is not None and weakest_enrollment.course is not None and weakest_enrollment.progress_percent < 75:
        next_target = min(100, weakest_enrollment.progress_percent + 15)
        plan.append(
            f"Вернитесь к курсу «{weakest_enrollment.course.title}» и поднимите прогресс хотя бы до {next_target}%."
        )

    if progress_events_count == 0:
        plan.append("Откройте следующий слайд в активном курсе: без движения по материалу Pulse не увидит прогресс.")

    if notes_count == 0:
        plan.append("Добавьте хотя бы одну заметку по сложной теме: так слабые места начнут проявляться точнее.")

    if ai_questions_count == 0:
        plan.append("Задайте один вопрос в AI-чате по последнему уроку, чтобы сразу закрыть непонятные моменты.")

    if site_visits < 2:
        plan.append("Зайдите на платформу ещё раз завтра, чтобы закрепить ритм и не обрывать серию.")

    if len(plan) < 3 and weakest_topic != "Пока не определена":
        plan.append(f"Сделайте короткое повторение по зоне риска: сейчас это «{weakest_topic}».")

    if len(plan) < 3:
        completed_courses = sum(1 for item in enrollments if item.status == "completed")
        if completed_courses < len(enrollments):
            plan.append("Доведите один из активных курсов до завершения: это сильнее всего поднимает готовность.")

    return plan[:3]


def _bucket_starts(period: PulsePeriod, *, now: datetime) -> list[datetime]:
    period_start = now - period.window
    return [period_start + period.bucket_size * index for index in range(period.bucket_count)]


def _bucket_index(created_at: datetime, *, period: PulsePeriod, starts: list[datetime], now: datetime) -> int | None:
    local_value = _to_local(created_at)
    if local_value < starts[0] or local_value > now:
        return None

    delta = local_value - starts[0]
    index = int(delta.total_seconds() // period.bucket_size.total_seconds())
    return min(period.bucket_count - 1, max(0, index))


def _build_chart(
    *,
    period: PulsePeriod,
    now: datetime,
    readiness: int,
    site_visits: list[UserActivity],
    progress_events: list[UserActivity],
    notes: list[CourseNote],
    ai_questions: list[AIChatMessage],
) -> list[int]:
    starts = _bucket_starts(period, now=now)
    buckets = [0 for _ in range(period.bucket_count)]
    has_any_activity = False

    for visit in site_visits:
        bucket = _bucket_index(visit.created_at, period=period, starts=starts, now=now)
        if bucket is None:
            continue
        buckets[bucket] += 14
        has_any_activity = True

    for event in progress_events:
        bucket = _bucket_index(event.created_at, period=period, starts=starts, now=now)
        if bucket is None:
            continue
        if event.event_type == COURSE_ENROLL_EVENT:
            buckets[bucket] += 18
        else:
            buckets[bucket] += 8 + min(24, max(0, event.value))
        has_any_activity = True

    for note in notes:
        bucket = _bucket_index(note.created_at, period=period, starts=starts, now=now)
        if bucket is None:
            continue
        buckets[bucket] += 16
        has_any_activity = True

    for message in ai_questions:
        bucket = _bucket_index(message.created_at, period=period, starts=starts, now=now)
        if bucket is None:
            continue
        buckets[bucket] += 12
        has_any_activity = True

    if not has_any_activity:
        return [readiness for _ in range(period.bucket_count)]

    base_line = max(8, round(readiness * 0.22)) if readiness > 0 else 0
    return [max(0, min(100, base_line + value)) for value in buckets]


def _active_dates(
    *,
    now: datetime,
    site_visits: list[UserActivity],
    progress_events: list[UserActivity],
    notes: list[CourseNote],
    ai_questions: list[AIChatMessage],
) -> set[date]:
    threshold = now - timedelta(days=30)
    values = [*site_visits, *progress_events, *notes, *ai_questions]
    return {
        _to_local(item.created_at).date()
        for item in values
        if _to_local(item.created_at) >= threshold
    }


def _streak_days(active_dates: set[date], *, now: datetime) -> int:
    if not active_dates:
        return 0

    streak = 0
    cursor = now.date()

    while cursor in active_dates:
        streak += 1
        cursor -= timedelta(days=1)

    return streak


def get_learning_pulse(db: Session, *, user: User) -> LearningPulseResponse:
    now = datetime.now(LOCAL_TIMEZONE)
    max_window = max(period.window for period in PULSE_PERIODS)
    since = now - max_window - timedelta(days=1)

    enrollments = list(
        db.scalars(
            select(Enrollment)
            .where(Enrollment.user_id == user.id)
            .options(selectinload(Enrollment.course))
            .order_by(Enrollment.updated_at.desc(), Enrollment.id.desc())
        )
    )
    activities = list(
        db.scalars(
            select(UserActivity)
            .where(UserActivity.user_id == user.id, UserActivity.created_at >= since)
            .order_by(UserActivity.created_at.asc(), UserActivity.id.asc())
        )
    )
    notes = list(
        db.scalars(
            select(CourseNote)
            .where(CourseNote.user_id == user.id, CourseNote.created_at >= since)
            .order_by(CourseNote.created_at.asc(), CourseNote.id.asc())
        )
    )
    ai_questions = list(
        db.scalars(
            select(AIChatMessage)
            .join(AIChatSession, AIChatSession.id == AIChatMessage.chat_session_id)
            .where(
                AIChatSession.user_id == user.id,
                AIChatMessage.role == "user",
                AIChatMessage.created_at >= since,
            )
            .order_by(AIChatMessage.created_at.asc(), AIChatMessage.id.asc())
        )
    )

    readiness = _compute_readiness(enrollments)
    weakest_topic = _weakest_topic(enrollments)
    site_visits = [item for item in activities if item.event_type == SITE_VISIT_EVENT]
    progress_events = [item for item in activities if item.event_type in {COURSE_ENROLL_EVENT, COURSE_PROGRESS_EVENT}]
    active_dates = _active_dates(
        now=now,
        site_visits=site_visits,
        progress_events=progress_events,
        notes=notes,
        ai_questions=ai_questions,
    )
    streak_days = _streak_days(active_dates, now=now)

    snapshots: dict[str, PulseSnapshotResponse] = {}

    for period in PULSE_PERIODS:
        period_start = now - period.window
        period_site_visits = [item for item in site_visits if _to_local(item.created_at) >= period_start]
        period_progress_events = [item for item in progress_events if _to_local(item.created_at) >= period_start]
        period_notes = [item for item in notes if _to_local(item.created_at) >= period_start]
        period_ai_questions = [item for item in ai_questions if _to_local(item.created_at) >= period_start]

        progress_events_count = sum(
            1 for item in period_progress_events if item.event_type == COURSE_PROGRESS_EVENT and item.value > 0
        )
        activity_count = len(period_progress_events) + len(period_notes) + len(period_ai_questions)

        snapshots[period.key] = PulseSnapshotResponse(
            label=period.label,
            readiness=readiness,
            activity_count=activity_count,
            site_visits=len(period_site_visits),
            streak_days=streak_days,
            weakest_topic=weakest_topic,
            chart=_build_chart(
                period=period,
                now=now,
                readiness=readiness,
                site_visits=period_site_visits,
                progress_events=period_progress_events,
                notes=period_notes,
                ai_questions=period_ai_questions,
            ),
            plan=_build_plan(
                enrollments=enrollments,
                weakest_topic=weakest_topic,
                site_visits=len(period_site_visits),
                notes_count=len(period_notes),
                ai_questions_count=len(period_ai_questions),
                progress_events_count=progress_events_count,
            ),
        )

    return LearningPulseResponse(
        today=snapshots["today"],
        week=snapshots["week"],
        sprint=snapshots["sprint"],
    )
