# База данных и эксплуатация

## Используемая СУБД и слой доступа
- `PostgreSQL` используется как основная СУБД.
- `SQLAlchemy ORM` описывает модели и связи.
- `Alembic` хранит и применяет миграции схемы.
- `psycopg` используется как PostgreSQL-драйвер.

## Основные сущности
- `users`: аккаунты, роли, статус, зашифрованный персональный GigaChat-ключ.
- `sessions`: refresh-сессии, user agent, IP, срок действия, отзыв сессии.
- `courses` и `course_slides`: курсы и учебные материалы.
- `enrollments`: прохождение курсов и прогресс.
- `course_notes`: пользовательские заметки.
- `ai_chat_sessions` и `ai_chat_messages`: история AI-диалогов.
- `user_activities`: события активности для аудита и Learning Pulse.

## Примеры SQL-запросов
```sql
SELECT id, title, category, level
FROM courses
ORDER BY updated_at DESC;

SELECT e.user_id, e.course_id, e.progress_percent, e.status
FROM enrollments e
WHERE e.user_id = 1;

SELECT created_at, event_type, course_id, value
FROM user_activities
WHERE user_id = 1
ORDER BY created_at DESC;
```

## Ограничения и триггеры
- `UNIQUE`: email пользователя, пара `user_id + course_id` для enrollments.
- `FOREIGN KEY`: связи между пользователями, курсами, заметками, сессиями, AI-чатом и активностями.
- `CHECK`: диапазон прогресса, неотрицательные числа часов/уроков, положительное значение активности, неотрицательный `order_index`.
- `TRIGGER`: для таблиц с `updated_at` настроен `BEFORE UPDATE` trigger, который принудительно обновляет временную метку.

## Резервное копирование
- Скрипт резервного копирования: [backup_postgres.sh](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/backend/scripts/backup_postgres.sh)
- Скрипт восстановления: [restore_postgres.sh](/Users/artemfarniev2013/WebstormProjects/kursach_1.0/backend/scripts/restore_postgres.sh)

Пример использования:
```bash
cd backend
export DATABASE_URL=postgresql+psycopg://postgres@127.0.0.1:5432/killexam
./scripts/backup_postgres.sh
./scripts/restore_postgres.sh ./backups/killexam_YYYYMMDD_HHMMSS.dump
```

## Безопасность хранения
- Пароли не сохраняются в открытом виде.
- Refresh-token и reset-token сохраняются в виде хеша.
- Персональный ключ GigaChat хранится в зашифрованном виде.
- Cookie-аутентификация снижает риск утечки JWT из клиентского JavaScript.
