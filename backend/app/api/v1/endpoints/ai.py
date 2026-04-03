from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.schemas.ai import AIHistoryResponse, AIAskRequest, AIAskResponse
from app.services.ai_service import ask_ai, get_history

router = APIRouter()


@router.post("/ask", response_model=AIAskResponse)
def ask_course_ai(
    payload: AIAskRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AIAskResponse:
    session_id, answer = ask_ai(db, user=user, course_id=payload.course_id, message=payload.message)
    return AIAskResponse(session_id=session_id, answer=answer)


@router.get("/history", response_model=AIHistoryResponse)
def get_ai_history(
    course_id: int = Query(alias="courseId"),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AIHistoryResponse:
    return get_history(db, user=user, course_id=course_id)
