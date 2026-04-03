from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.core.db import get_db
from app.schemas.course import AdminCourseResponse, AdminCourseWriteRequest
from app.schemas.user import AdminUserResponse, AdminUserUpdateRequest
from app.services.admin_course_service import (
    create_admin_course,
    delete_admin_course,
    list_admin_courses,
    serialize_admin_course,
    update_admin_course,
)
from app.services.admin_service import delete_admin_user, list_admin_users, serialize_admin_user, update_admin_user

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


@router.get("/courses", response_model=list[AdminCourseResponse])
def admin_list_courses(
    search: str = Query(default="", description="Поиск по id, title, category или level"),
    db: Session = Depends(get_db),
) -> list[AdminCourseResponse]:
    courses = list_admin_courses(db, search=search)
    return [serialize_admin_course(course) for course in courses]


@router.post("/courses", response_model=AdminCourseResponse, status_code=status.HTTP_201_CREATED)
def admin_create_course_endpoint(
    payload: AdminCourseWriteRequest,
    db: Session = Depends(get_db),
) -> AdminCourseResponse:
    course = create_admin_course(db, payload)
    return serialize_admin_course(course)


@router.patch("/courses/{course_id}", response_model=AdminCourseResponse)
def admin_update_course_endpoint(
    course_id: int,
    payload: AdminCourseWriteRequest,
    db: Session = Depends(get_db),
) -> AdminCourseResponse:
    course = update_admin_course(db, course_id=course_id, payload=payload)
    return serialize_admin_course(course)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_course_endpoint(course_id: int, db: Session = Depends(get_db)) -> Response:
    delete_admin_course(db, course_id=course_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users", response_model=list[AdminUserResponse])
def admin_list_users(
    search: str = Query(default="", description="Поиск по id, email или имени"),
    db: Session = Depends(get_db),
) -> list[AdminUserResponse]:
    users = list_admin_users(db, search=search)
    return [serialize_admin_user(user) for user in users]


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def admin_update_user(
    user_id: int,
    payload: AdminUserUpdateRequest,
    current_admin=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> AdminUserResponse:
    user = update_admin_user(db, current_admin=current_admin, user_id=user_id, payload=payload)
    return serialize_admin_user(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    current_admin=Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Response:
    delete_admin_user(db, current_admin=current_admin, user_id=user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/feedback/tickets")
def admin_feedback_tickets() -> dict[str, str]:
    return {"message": "planned"}
