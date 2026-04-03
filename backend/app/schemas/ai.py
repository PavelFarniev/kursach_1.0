from pydantic import Field

from app.schemas.base import CamelModel


class AIAskRequest(CamelModel):
    course_id: int
    message: str = Field(min_length=1, max_length=2000)


class AIMessageResponse(CamelModel):
    id: str
    role: str
    content: str
    created_at: str


class AIAskResponse(CamelModel):
    session_id: int
    answer: str


class AIHistoryResponse(CamelModel):
    session_id: int
    messages: list[AIMessageResponse]
