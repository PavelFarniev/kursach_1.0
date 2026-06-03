# Backend

## Стек
- Python
- FastAPI
- SQLAlchemy ORM
- Alembic
- PostgreSQL
- Pydantic
- bcrypt / JWT
- GigaChat SDK

## Реализованные блоки
- auth, register, refresh, logout, change password, password reset;
- профиль пользователя и Learning Pulse;
- каталог курсов и экран обучения;
- заметки, enrollments и AI-чат;
- admin API для пользователей и курсов;
- файловый аудит действий и измерение времени ответа.

## Аутентификация
- access и refresh токены выдаются backend;
- backend выставляет `HttpOnly` cookie для серверной сессии;
- logout отзывает текущую refresh-сессию и очищает cookie;
- при 401 frontend пробует обновить сессию через refresh endpoint.

## Аудит
- файл аудита по умолчанию: `backend/runtime_logs/audit.log`;
- логируются авторизация, logout, admin-действия, AI-запросы, заметки и изменения прогресса.

## База данных
- миграции лежат в `backend/alembic/versions`;
- добавлены `CHECK`-ограничения и trigger-ы на обновление `updated_at`;
- backup/restore скрипты лежат в `backend/scripts`.

## Локальный запуск
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
createdb killexam
alembic upgrade head
uvicorn app.main:app --reload
```

## Тесты
```bash
cd backend
./.venv/bin/python -m unittest discover -s tests
```

## Настройки
- локальный шаблон окружения: [backend/.env.example](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/backend/.env.example)
- backup: [backup_postgres.sh](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/backend/scripts/backup_postgres.sh)
- restore: [restore_postgres.sh](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/backend/scripts/restore_postgres.sh)
