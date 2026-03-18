from pydantic import BaseModel, Field


class EnrollmentCreateRequest(BaseModel):
    course_id: int


class EnrollmentProgressPatchRequest(BaseModel):
    progress_percent: int = Field(ge=0, le=100)


class EnrollmentResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    progress_percent: int
    status: str
