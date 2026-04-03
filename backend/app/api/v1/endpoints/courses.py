from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.course import CourseDetailResponse, CourseResponse
from app.services.course_service import get_course_by_id, list_courses, serialize_course, serialize_course_detail

router = APIRouter()


@router.get("", response_model=list[CourseResponse])
def get_courses(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    level: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CourseResponse]:
    courses = list_courses(db, search=search, category=category, level=level)
    return [serialize_course(course) for course in courses]


@router.get("/{course_id}", response_model=CourseDetailResponse)
def get_course(course_id: int, db: Session = Depends(get_db)) -> CourseDetailResponse:
    course = get_course_by_id(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден")

    return serialize_course_detail(course)
