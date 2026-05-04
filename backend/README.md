# Backend (FastAPI) - AI Exam Prep Platform

Рабочий backend V1 для auth, каталога курсов, enrollments, заметок и базовых AI/feedback endpoints.

## Stack
- Python + FastAPI
- SQLAlchemy ORM
- Alembic migrations
- PostgreSQL по умолчанию через `DATABASE_URL=postgresql+psycopg://postgres@127.0.0.1:5432/killexam`
- JWT auth (access + refresh)
- passlib bcrypt password hashing
- Pydantic schemas с camelCase JSON

## Реализованные сущности
- User
- Session
- PasswordReset
- Course
- Enrollment
- CourseNote
- FeedbackTicket
- AIChatSession
- AIChatMessage

## Основные API endpoints
### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/change-password`
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

### Notes
- `GET /api/v1/notes/my`
- `POST /api/v1/notes`
- `DELETE /api/v1/notes/{note_id}`

## Folder overview
- `app/api` - routers and endpoint modules
- `app/models` - SQLAlchemy models
- `app/schemas` - request/response Pydantic models
- `app/services` - domain services
- `app/core` - settings, DB, security
- `alembic` - migration environment and versions

## Local run
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
createdb killexam
alembic upgrade head
uvicorn app.main:app --reload
```

Приложение больше не создаёт таблицы через `Base.metadata.create_all()`. Если схема не применена, startup пропустит сидирование и выведет предупреждение.

## Seed data
- При старте backend сидирует каталог курсов, если таблицы уже созданы миграциями.
- Также создаётся demo-пользователь `demo@student.ai / demo123`, если его ещё нет.
