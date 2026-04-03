from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.ai_chat_message import AIChatMessage
from app.models.ai_chat_session import AIChatSession
from app.models.course import Course
from app.models.user import User
from app.schemas.ai import AIHistoryResponse, AIMessageResponse


def _generate_answer(course_title: str, question: str) -> str:
    normalized = question.lower()

    if "план" in normalized or "распис" in normalized:
        return (
            f"Для курса «{course_title}» советую такой мини-план: 1) 25 минут теории, "
            "2) 5-7 задач на закрепление, 3) короткий разбор ошибок и повтор через день."
        )

    if "ошиб" in normalized or "не понимаю" in normalized:
        return (
            "Разберем тему по шагам: сначала правило, затем короткий пример, потом типичная ошибка "
            "и способ ее избежать. Если хочешь, пришли конкретное задание."
        )

    if "шпаргал" in normalized or "кратко" in normalized:
        return "Укажи тему точнее, и я соберу короткую шпаргалку: правило, формула, ловушки и мини-пример."

    return "Хороший запрос. Начни с ключевого правила темы, затем реши 2 базовые задачи и 1 задачу на перенос навыка."


def _get_or_create_chat_session(db: Session, *, user_id: int, course_id: int) -> AIChatSession:
    session = db.scalar(
        select(AIChatSession).where(AIChatSession.user_id == user_id, AIChatSession.course_id == course_id)
    )
    if session is not None:
        return session

    session = AIChatSession(user_id=user_id, course_id=course_id, title="Course Assistant")
    db.add(session)
    db.flush()
    return session


def ask_ai(db: Session, *, user: User, course_id: int, message: str) -> tuple[int, str]:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден")

    chat_session = _get_or_create_chat_session(db, user_id=user.id, course_id=course_id)
    answer = _generate_answer(course.title, message)

    db.add(AIChatMessage(chat_session_id=chat_session.id, role="user", content=message.strip()))
    db.add(AIChatMessage(chat_session_id=chat_session.id, role="assistant", content=answer))
    db.commit()

    return chat_session.id, answer


def get_history(db: Session, *, user: User, course_id: int) -> AIHistoryResponse:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден")

    chat_session = db.scalar(
        select(AIChatSession)
        .where(AIChatSession.user_id == user.id, AIChatSession.course_id == course_id)
        .options(selectinload(AIChatSession.messages))
    )

    if chat_session is None:
        return AIHistoryResponse(session_id=0, messages=[])

    messages = [
        AIMessageResponse(
            id=str(message.id),
            role=message.role,
            content=message.content,
            created_at=message.created_at.isoformat(),
        )
        for message in sorted(chat_session.messages, key=lambda item: item.created_at)
    ]
    return AIHistoryResponse(session_id=chat_session.id, messages=messages)
