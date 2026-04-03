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


class AdminCourseSlideWriteRequest(CamelModel):
    id: int | None = None
    order_index: int = Field(default=0, ge=0)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1)
    theory_blocks: list[str] = Field(default_factory=list, min_length=1)
    bullets: list[str] = Field(default_factory=list, min_length=1)
    example: str = Field(min_length=1)
    practice_task: str = Field(min_length=1)


class AdminCourseWriteRequest(CamelModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=80)
    level: str = Field(min_length=1, max_length=40)
    lessons_count: int = Field(ge=1)
    estimated_hours: int = Field(ge=1)
    slides: list[AdminCourseSlideWriteRequest] = Field(default_factory=list, min_length=1)


class AdminCourseSlideResponse(CamelModel):
    id: int
    order_index: int
    title: str
    summary: str
    theory_blocks: list[str] = Field(default_factory=list)
    bullets: list[str] = Field(default_factory=list)
    example: str
    practice_task: str


class AdminCourseResponse(CamelModel):
    id: int
    title: str
    description: str
    category: str
    level: str
    lessons_count: int
    estimated_hours: int
    slides: list[AdminCourseSlideResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str
