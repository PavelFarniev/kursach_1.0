from AIagent.gigachat_agent import AgentMessage, GigaChatRequestError, ask_course_agent
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.crypto import decrypt_secret
from app.core.gigachat_credentials import InvalidGigaChatCredentialsError
from app.models.ai_chat_message import AIChatMessage
from app.models.ai_chat_session import AIChatSession
from app.models.course import Course
from app.models.user import User
from app.schemas.ai import AIHistoryResponse, AIMessageResponse


def _get_or_create_chat_session(
    db: Session, *, user_id: int, course_id: int
) -> AIChatSession:
    session = db.scalar(
        select(AIChatSession).where(
            AIChatSession.user_id == user_id, AIChatSession.course_id == course_id
        )
    )
    if session is not None:
        return session

    session = AIChatSession(
        user_id=user_id, course_id=course_id, title="Course Assistant"
    )
    db.add(session)
    db.flush()
    return session


def _build_course_description(course: Course) -> str:
    slide_lines: list[str] = []

    for slide in course.slides:
        slide_lines.append(
            "\n".join(
                [
                    f"Тема: {slide.title}",
                    f"Кратко: {slide.summary}",
                    f"Теория: {'; '.join(slide.theory_blocks or [])}",
                    f"Ключевые пункты: {'; '.join(slide.bullets or [])}",
                    f"Пример: {slide.example}",
                    f"Практика: {slide.practice_task}",
                ]
            )
        )

    slides_context = (
        "\n\n".join(slide_lines) if slide_lines else "Материалы слайдов не добавлены."
    )
    return f"{course.description}\n\nМатериалы курса:\n{slides_context}"


def ask_ai(db: Session, *, user: User, course_id: int, message: str) -> tuple[int, str]:
    user_gigachat_credentials = decrypt_secret(user.gigachat_credentials_encrypted)
    if not user_gigachat_credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Добавьте личный GigaChat Authorization Key в настройках AI-чата",
        )

    course = db.scalar(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.slides))
    )
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден"
        )

    chat_session = _get_or_create_chat_session(db, user_id=user.id, course_id=course_id)
    history = [
        AgentMessage(role=item.role, content=item.content)
        for item in db.scalars(
            select(AIChatMessage)
            .where(AIChatMessage.chat_session_id == chat_session.id)
            .order_by(AIChatMessage.created_at)
        ).all()
    ]
    try:
        answer = ask_course_agent(
            course_title=course.title,
            course_category=course.category,
            course_description=_build_course_description(course),
            user_message=message,
            history=history,
            gigachat_credentials=user_gigachat_credentials,
        )
    except InvalidGigaChatCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except GigaChatRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    db.add(
        AIChatMessage(
            chat_session_id=chat_session.id, role="user", content=message.strip()
        )
    )
    db.add(
        AIChatMessage(chat_session_id=chat_session.id, role="assistant", content=answer)
    )
    db.commit()

    return chat_session.id, answer


def get_history(db: Session, *, user: User, course_id: int) -> AIHistoryResponse:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден"
        )

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
