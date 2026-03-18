from fastapi import APIRouter

from app.schemas.ai import AIHistoryResponse, AIAskRequest, AIAskResponse

router = APIRouter()


@router.post("/ask", response_model=AIAskResponse)
def ask_ai(_: AIAskRequest) -> AIAskResponse:
    return AIAskResponse(session_id=0, answer="AI integration is planned.")


@router.get("/history", response_model=AIHistoryResponse)
def get_ai_history() -> AIHistoryResponse:
    return AIHistoryResponse(session_id=0, messages=[])
