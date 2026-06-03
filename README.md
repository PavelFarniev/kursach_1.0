# KillExam

Полноценная учебная платформа для подготовки к экзаменам с каталогом курсов, прогрессом, заметками, AI-ассистентом и административной панелью.

## Что реализовано
- авторизация, регистрация, смена пароля и серверные сессии;
- каталог курсов, карточка курса и экран обучения;
- заметки пользователя и AI-чат внутри курса;
- профиль и Learning Pulse;
- административное управление пользователями и курсами;
- backend-аудит в файл, backup/restore скрипты и миграции БД;
- frontend и backend автотесты.

## Архитектура
- `frontend/`: React + TypeScript + Vite + Zustand + Axios.
- `backend/`: FastAPI + SQLAlchemy + Alembic + PostgreSQL + GigaChat.
- `docs/`: инструкция по эксплуатации, БД, тестирование и заметки по соответствию требованиям.

## Быстрый старт
### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
createdb killexam
alembic upgrade head
uvicorn app.main:app --reload
```

## Документация
- [Инструкция по эксплуатации](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/docs/user-manual.md)
- [База данных и backup/restore](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/docs/database-operations.md)
- [Тестирование](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/docs/testing.md)
- [Соответствие требованиям и ГОСТам](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/docs/gost-compliance.md)

## Проверка качества
```bash
cd frontend && npm run test:run && npm run build
cd backend && ./.venv/bin/python -m unittest discover -s tests
```

## Безопасность
- пользовательские сессии backend поддерживает через `HttpOnly` cookie;
- refresh-сессии можно отзывать через logout;
- аудит действий пишется в `backend/runtime_logs/audit.log`;
- локальный шаблон настроек лежит в [backend/.env.example](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/backend/.env.example).

## Важно
- Для production нужно задать собственный `JWT_SECRET_KEY`.
- Если среда подменяет сертификаты GigaChat, настройте `GIGACHAT_CA_BUNDLE_FILE` и включите `GIGACHAT_VERIFY_SSL_CERTS=true`.
