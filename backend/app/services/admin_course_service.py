from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course
from app.models.course_slide import CourseSlide
from app.schemas.course import (
    AdminCourseResponse,
    AdminCourseSlideResponse,
    AdminCourseWriteRequest,
)


def _format_timestamp(value: datetime) -> str:
    return value.isoformat()


def serialize_admin_course_slide(slide: CourseSlide) -> AdminCourseSlideResponse:
    return AdminCourseSlideResponse(
        id=slide.id,
        order_index=slide.order_index,
        title=slide.title,
        summary=slide.summary,
        theory_blocks=list(slide.theory_blocks or []),
        bullets=list(slide.bullets or []),
        example=slide.example,
        practice_task=slide.practice_task,
    )


def serialize_admin_course(course: Course) -> AdminCourseResponse:
    ordered_slides = sorted(course.slides, key=lambda item: item.order_index)
    return AdminCourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        category=course.category,
        level=course.level,
        lessons_count=course.lessons_count,
        estimated_hours=course.estimated_hours,
        slides=[serialize_admin_course_slide(slide) for slide in ordered_slides],
        created_at=_format_timestamp(course.created_at),
        updated_at=_format_timestamp(course.updated_at),
    )


def list_admin_courses(db: Session, *, search: str = "") -> list[Course]:
    courses = list(
        db.scalars(
            select(Course)
            .options(selectinload(Course.slides))
            .order_by(Course.updated_at.desc(), Course.id.desc())
        )
    )
    normalized_search = search.strip().casefold()

    if not normalized_search:
        return courses

    matched_courses: list[Course] = []
    search_id = int(normalized_search) if normalized_search.isdigit() else None

    for course in courses:
        if search_id is not None and course.id == search_id:
            matched_courses.append(course)
            continue

        haystack = (
            course.title.casefold(),
            course.category.casefold(),
            course.level.casefold(),
        )
        if any(normalized_search in value for value in haystack):
            matched_courses.append(course)

    return matched_courses


def get_admin_course(db: Session, course_id: int) -> Course | None:
    return db.scalar(select(Course).options(selectinload(Course.slides)).where(Course.id == course_id))


def _normalize_text(value: str, field_name: str) -> str:
    normalized = value.strip()

    if not normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Поле {field_name} не может быть пустым")

    return normalized


def _normalize_string_list(values: list[str], field_name: str) -> list[str]:
    normalized = [item.strip() for item in values if item.strip()]

    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поле {field_name} должно содержать хотя бы один непустой элемент",
        )

    return normalized


def _ordered_payload_slides(payload: AdminCourseWriteRequest):
    return sorted(payload.slides, key=lambda slide: (slide.order_index, slide.id or 0))


def _build_slide_models(course_id: int, payload: AdminCourseWriteRequest) -> list[CourseSlide]:
    slides: list[CourseSlide] = []

    for index, slide in enumerate(_ordered_payload_slides(payload)):
        slides.append(
            CourseSlide(
                course_id=course_id,
                order_index=index,
                title=_normalize_text(slide.title, "title"),
                summary=_normalize_text(slide.summary, "summary"),
                theory_blocks=_normalize_string_list(slide.theory_blocks, "theoryBlocks"),
                bullets=_normalize_string_list(slide.bullets, "bullets"),
                example=_normalize_text(slide.example, "example"),
                practice_task=_normalize_text(slide.practice_task, "practiceTask"),
            )
        )

    return slides


def _apply_course_fields(course: Course, payload: AdminCourseWriteRequest) -> None:
    course.title = _normalize_text(payload.title, "title")
    course.description = _normalize_text(payload.description, "description")
    course.category = _normalize_text(payload.category, "category")
    course.level = _normalize_text(payload.level, "level")
    course.lessons_count = payload.lessons_count
    course.estimated_hours = payload.estimated_hours


def create_admin_course(db: Session, payload: AdminCourseWriteRequest) -> Course:
    course = Course(
        title="pending",
        description="pending",
        category="pending",
        level="pending",
        lessons_count=payload.lessons_count,
        estimated_hours=payload.estimated_hours,
    )
    _apply_course_fields(course, payload)

    db.add(course)
    db.flush()
    db.add_all(_build_slide_models(course.id, payload))
    db.commit()
    db.expire_all()

    return get_admin_course(db, course.id) or course


def update_admin_course(db: Session, *, course_id: int, payload: AdminCourseWriteRequest) -> Course:
    course = get_admin_course(db, course_id)

    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден")

    _apply_course_fields(course, payload)
    db.add(course)
    db.flush()

    db.execute(delete(CourseSlide).where(CourseSlide.course_id == course.id))
    db.flush()
    db.add_all(_build_slide_models(course.id, payload))
    db.commit()
    db.expire_all()

    refreshed = get_admin_course(db, course.id)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден после обновления")

    return refreshed


def delete_admin_course(db: Session, *, course_id: int) -> None:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Курс не найден")

    db.delete(course)
    db.commit()
