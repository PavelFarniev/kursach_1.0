from fastapi import APIRouter

from app.api.v1.endpoints import admin, ai, auth, courses, enrollments, feedback, notes, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/user", tags=["user"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["enrollments"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
