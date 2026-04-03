from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.course_note import CourseNote
from app.models.user import User


def list_notes(db: Session, *, user: User) -> list[CourseNote]:
    statement = select(CourseNote).where(CourseNote.user_id == user.id).order_by(CourseNote.created_at.asc(), CourseNote.id.asc())
    return list(db.scalars(statement))


def create_note(db: Session, *, user: User, course_id: int, content: str) -> CourseNote:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден")

    note = CourseNote(user_id=user.id, course_id=course_id, content=content.strip())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, *, user: User, note_id: int) -> None:
    note = db.scalar(select(CourseNote).where(CourseNote.id == note_id, CourseNote.user_id == user.id))

    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заметка не найдена")

    db.delete(note)
    db.commit()
