from fastapi import APIRouter

router = APIRouter()


@router.get("/courses")
def admin_list_courses() -> dict[str, str]:
    return {"message": "planned"}


@router.post("/courses")
def admin_create_course() -> dict[str, str]:
    return {"message": "planned"}


@router.patch("/courses/{course_id}")
def admin_update_course(course_id: int) -> dict[str, int | str]:
    return {"course_id": course_id, "message": "planned"}


@router.get("/users")
def admin_list_users() -> dict[str, str]:
    return {"message": "planned"}


@router.get("/feedback/tickets")
def admin_feedback_tickets() -> dict[str, str]:
    return {"message": "planned"}
