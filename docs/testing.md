# Тестирование

## Frontend
- Инструменты: `Vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- Покрытые сценарии:
  - доступные подписи и изменение фильтров каталога;
  - клиентская валидация формы входа;
  - устойчивость AI-чата при ошибке API.

Команды:
```bash
cd frontend
npm run test:run
npm run build
```

## Backend
- Инструменты: `unittest`, `FastAPI TestClient`, временный PostgreSQL harness на базе `initdb/pg_ctl`.
- Покрытые сценарии:
  - административные операции;
  - Learning Pulse и активность;
  - cookie-аутентификация и logout;
  - базовые проверки времени ответа.

Команды:
```bash
cd backend
./.venv/bin/python -m unittest discover -s tests
```

## Время реакции
- В приложении включён заголовок `X-Process-Time-Ms` для каждого HTTP-ответа.
- Slow request warning срабатывает при превышении `RESPONSE_TIME_WARNING_MS`.
- В backend-тестах есть контроль базового времени ответа для ключевых endpoint-ов.
