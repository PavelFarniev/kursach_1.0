# Подготовка к экзаменам с AI

Стартовая версия проекта с разделением на:
- `backend` — архитектурный FastAPI-скелет под дальнейшую реализацию
- `frontend` — реализованное ядро MVP (React + TypeScript + Vite)

## Что сделано в этом этапе
Реализована только основная часть MVP:
1. Вход / регистрация
2. Каталог курсов
3. Страница курса
4. Прогресс по курсу
5. AI-чат внутри курса
6. Профиль пользователя с его курсами

## Структура
- `backend/` — FastAPI/SQLAlchemy/Alembic/JWT-ready каркас с ERD-моделями и endpoint-заглушками
- `frontend/` — рабочее приложение с роутингом, состоянием и mock API

## Быстрый старт фронтенда
```bash
cd frontend
npm install
npm run dev
```

## Почему backend пока скелет
По задаче текущего этапа реализуется только frontend-ядро продукта. Backend подготовлен архитектурно (модели, схемы, сервисы, endpoints) и согласован с:
- Use Case roles: Гость / Пользователь / Администратор
- User Story Map основного потока
- ERD сущностями: User, Session, PasswordReset, Course, Enrollment, FeedbackTicket, AIChatSession, AIChatMessage
