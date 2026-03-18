from pydantic import BaseModel, Field


class AIAskRequest(BaseModel):
    course_id: int
    message: str = Field(min_length=1, max_length=2000)


class AIMessageResponse(BaseModel):
    role: str
    content: str


class AIAskResponse(BaseModel):
    session_id: int
    answer: str


class AIHistoryResponse(BaseModel):
    session_id: int
    messages: list[AIMessageResponse]
