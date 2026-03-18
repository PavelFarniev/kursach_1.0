from pydantic import BaseModel


class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    level: str


class CourseListResponse(BaseModel):
    items: list[CourseResponse]
