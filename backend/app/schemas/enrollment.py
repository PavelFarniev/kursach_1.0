from pydantic import BaseModel, Field

from app.schemas.base import CamelModel
from app.schemas.course import CourseResponse


class EnrollmentCreateRequest(CamelModel):
    course_id: int


class EnrollmentProgressPatchRequest(CamelModel):
    progress_percent: int = Field(ge=0, le=100)


class EnrollmentResponse(CamelModel):
    id: int
    user_id: int
    course_id: int
    progress_percent: int
    status: str


class EnrollmentWithCourseResponse(EnrollmentResponse):
    course: CourseResponse
