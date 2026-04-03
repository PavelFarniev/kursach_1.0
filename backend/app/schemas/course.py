from pydantic import Field

from app.schemas.base import CamelModel


class CourseFilters(CamelModel):
    search: str | None = Field(default=None, max_length=120)
    category: str | None = Field(default=None, max_length=80)
    level: str | None = Field(default=None, max_length=40)


class CourseResponse(CamelModel):
    id: int
    title: str
    description: str
    category: str
    level: str
    lessons_count: int
    estimated_hours: int


class CourseSlideResponse(CamelModel):
    id: str
    title: str
    summary: str
    theory_blocks: list[str] = Field(default_factory=list)
    bullets: list[str] = Field(default_factory=list)
    example: str
    practice_task: str


class CourseDetailResponse(CourseResponse):
    slides: list[CourseSlideResponse] = Field(default_factory=list)
