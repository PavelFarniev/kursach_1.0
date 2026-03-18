from pydantic import BaseModel, Field


class FeedbackTicketCreateRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=10, max_length=3000)


class FeedbackTicketResponse(BaseModel):
    id: int
    status: str
