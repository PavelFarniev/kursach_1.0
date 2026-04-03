from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.core.db import get_db
from app.schemas.user import AdminUserResponse, AdminUserUpdateRequest
from app.services.admin_service import delete_admin_user, list_admin_users, serialize_admin_user, update_admin_user

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


@router.get("/courses")
def admin_list_courses() -> dict[str, str]:
    return {"message": "planned"}


@router.post("/courses")
def admin_create_course() -> dict[str, str]:
    return {"message": "planned"}


@router.patch("/courses/{course_id}")
def admin_update_course(course_id: int) -> dict[str, int | str]:
    return {"course_id": course_id, "message": "planned"}


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
