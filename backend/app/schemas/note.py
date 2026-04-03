from pydantic import Field

from app.schemas.base import CamelModel


class CourseNoteCreateRequest(CamelModel):
    course_id: int
    content: str = Field(min_length=1, max_length=4000)


class CourseNoteResponse(CamelModel):
    id: int
    course_id: int
    content: str
    created_at: str
