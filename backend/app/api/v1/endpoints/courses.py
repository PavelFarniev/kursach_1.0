from fastapi import APIRouter

from app.schemas.course import CourseListResponse, CourseResponse

router = APIRouter()


@router.get("", response_model=CourseListResponse)
def list_courses() -> CourseListResponse:
    return CourseListResponse(items=[])


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int) -> CourseResponse:
    return CourseResponse(
        id=course_id,
        title="Planned Course",
        description="Course endpoint scaffold.",
        category="General",
        level="Beginner",
    )
