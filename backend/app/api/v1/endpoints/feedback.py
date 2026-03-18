from fastapi import APIRouter

from app.schemas.feedback import FeedbackTicketCreateRequest, FeedbackTicketResponse

router = APIRouter()


@router.post("/tickets", response_model=FeedbackTicketResponse)
def create_feedback_ticket(_: FeedbackTicketCreateRequest) -> FeedbackTicketResponse:
    return FeedbackTicketResponse(id=0, status="open")
