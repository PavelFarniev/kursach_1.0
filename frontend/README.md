# Frontend (React + TypeScript + Vite)

Стартовая реализация ядра MVP проекта **«Подготовка к экзаменам с AI»**.

## Что реализовано (core MVP)
- Экран входа (`/login`) и регистрации (`/register`) с валидацией и loading/error состояниями
- Каталог курсов (`/courses`) с поиском и фильтрами (category + level)
- Страница курса (`/courses/:id`) с блоком прогресса и кнопкой «Начать/Продолжить курс»
- AI-чат внутри курса (mock, готов к подключению FastAPI endpoint `/api/v1/ai/ask`)
- Личный кабинет (`/profile`) с данными пользователя и списком его курсов
- Роутинг через React Router v6
- Глобальное состояние через Zustand (`authStore`, `courseStore`, `enrollmentStore`, `chatStore`)
- API layer на Axios + mock services
- UI на базе shadcn/ui-подхода (reusable `Button`, `Card`, `Input`, `Textarea`, `Badge`, `Tabs`, `Progress`)

## Стек
- React + TypeScript
- Vite
- React Router v6
- Zustand
- Axios
- shadcn/ui (структура и паттерн компонентов)
- Tailwind CSS

## Запуск
```bash
cd frontend
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`.

## Demo-аккаунт
- Email: `demo@student.ai`
- Password: `demo123`

## Архитектура и согласованность

### Use Case alignment
- **Гость**: регистрация, вход, просмотр каталога после авторизации
- **Пользователь**: выбор курса, старт/продолжение обучения, работа с AI-ассистентом, просмотр прогресса в профиле
- **Администратор**: не реализован в UI, но предусмотрен в backend API-скелете

### User Story Map alignment
Основной сценарий поддержан в интерфейсе:
1. Вход/регистрация
2. Просмотр каталога
3. Выбор курса
4. Начало/продолжение обучения
5. Взаимодействие с AI внутри курса
6. Отслеживание прогресса
7. Переход в профиль с курсами и статусами

### ERD alignment
Frontend API layer подготовлен под сущности:
- User, Session, PasswordReset
- Course, Enrollment
- FeedbackTicket (future)
- AIChatSession, AIChatMessage

Подготовлены контракты endpoint-ов:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/user/profile`
- `GET /api/v1/courses`
- `GET /api/v1/courses/:id`
- `POST /api/v1/enrollments`
- `GET /api/v1/enrollments/my`
- `PATCH /api/v1/enrollments/:id/progress`
- `POST /api/v1/ai/ask`
- `GET /api/v1/ai/history`

## Что не делалось специально
- Полный backend
- Админка
- Платежи, уведомления, ticket-система full-flow
- Сброс пароля в UI (учтено архитектурно)
- Docker, тесты, websocket, redis

