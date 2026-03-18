# Backend (FastAPI) - AI Exam Prep Platform

This folder is a prepared backend foundation for a future full implementation.
Current scope: architecture-aligned skeleton only, separated from frontend.

## Planned stack
- Python + FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Alembic migrations
- JWT auth (access + refresh)
- passlib bcrypt password hashing
- Pydantic schemas
- OpenAI Python library for AI assistant endpoints

## Why this structure
The structure follows:
- Use Case Diagram (Guest / User / Admin)
- User Story Map core flow (auth -> course catalog -> course learning -> AI chat -> profile)
- ERD entities and relationships

## ERD entities covered in code skeleton
- User
- Session
- PasswordReset
- Course
- Enrollment
- FeedbackTicket
- AIChatSession
- AIChatMessage

## Planned API endpoints (v1)
### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`

### User
- `GET /api/v1/user/profile`

### Courses
- `GET /api/v1/courses`
- `GET /api/v1/courses/{course_id}`

### Enrollments
- `POST /api/v1/enrollments`
- `GET /api/v1/enrollments/my`
- `PATCH /api/v1/enrollments/{enrollment_id}/progress`

### AI assistant
- `POST /api/v1/ai/ask`
- `GET /api/v1/ai/history`

### Feedback
- `POST /api/v1/feedback/tickets`
- `GET /api/v1/admin/feedback/tickets`

### Admin (future)
- `GET /api/v1/admin/courses`
- `POST /api/v1/admin/courses`
- `PATCH /api/v1/admin/courses/{course_id}`
- `GET /api/v1/admin/users`

## Folder overview
- `app/api` - routers and endpoint modules
- `app/models` - SQLAlchemy models based on ERD
- `app/schemas` - request/response Pydantic models
- `app/services` - domain services (auth, courses, ai, etc.)
- `app/core` - settings, db, security, shared infra

## Run (when backend is implemented)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Current status
This is a prepared architecture scaffold. Business logic, DB migrations, and real integrations are intentionally deferred to later iterations.
