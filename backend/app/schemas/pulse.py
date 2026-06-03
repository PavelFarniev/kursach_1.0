from app.schemas.base import CamelModel


class PulseSnapshotResponse(CamelModel):
    label: str
    readiness: int
    activity_count: int
    site_visits: int
    streak_days: int
    weakest_topic: str
    chart: list[int]
    plan: list[str]


class LearningPulseResponse(CamelModel):
    today: PulseSnapshotResponse
    week: PulseSnapshotResponse
    sprint: PulseSnapshotResponse
