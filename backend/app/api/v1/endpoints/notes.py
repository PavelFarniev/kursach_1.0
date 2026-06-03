from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.audit import log_audit_event
from app.core.db import get_db
from app.schemas.auth import MessageResponse
from app.schemas.note import CourseNoteCreateRequest, CourseNoteResponse
from app.services.note_service import create_note, delete_note, list_notes

router = APIRouter()


@router.get("/my", response_model=list[CourseNoteResponse])
def get_my_notes(user=Depends(get_current_user), db: Session = Depends(get_db)) -> list[CourseNoteResponse]:
    notes = list_notes(db, user=user)
    return [
        CourseNoteResponse(
            id=note.id,
            course_id=note.course_id,
            content=note.content,
            created_at=note.created_at.isoformat(),
        )
        for note in notes
    ]


@router.post("", response_model=CourseNoteResponse, status_code=status.HTTP_201_CREATED)
def create_course_note(
    payload: CourseNoteCreateRequest,
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseNoteResponse:
    note = create_note(db, user=user, course_id=payload.course_id, content=payload.content)
    log_audit_event(
        event="note.create",
        actor_id=user.id,
        actor_email=user.email,
        resource=f"note:{note.id}",
        request=request,
        details={"course_id": note.course_id},
    )
    return CourseNoteResponse(id=note.id, course_id=note.course_id, content=note.content, created_at=note.created_at.isoformat())


@router.delete("/{note_id}", response_model=MessageResponse)
def remove_course_note(
    note_id: int,
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    delete_note(db, user=user, note_id=note_id)
    log_audit_event(
        event="note.delete",
        actor_id=user.id,
        actor_email=user.email,
        resource=f"note:{note_id}",
        request=request,
    )
    return MessageResponse(message="Заметка удалена")
