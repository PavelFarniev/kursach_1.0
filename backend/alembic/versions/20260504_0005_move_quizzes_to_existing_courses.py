"""remove standalone theory course and append quizzes to existing courses

Revision ID: 20260504_0005
Revises: 20260504_0004
Create Date: 2026-05-04 00:30:00.000000
"""

from collections.abc import Sequence

from alembic import context, op
import sqlalchemy as sa

from app.services.course_service import COURSE_SLIDES_BY_TITLE

# revision identifiers, used by Alembic.
revision: str = "20260504_0005"
down_revision: str | None = "20260504_0004"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

REMOVED_COURSE_TITLE = "Теория и аналитика платформ подготовки к экзаменам"
TARGET_COURSE_TITLES = [
    "ЕГЭ Математика: профиль",
    "ЕГЭ Русский язык",
    "ОГЭ Физика",
    "ЕГЭ Обществознание",
    "IELTS Writing Booster",
]
QUIZ_SLIDE_TITLE = "Итоговое тестирование"


def upgrade() -> None:
    if context.is_offline_mode():
        return

    connection = op.get_bind()

    courses_table = sa.table(
        "courses",
        sa.column("id", sa.Integer()),
        sa.column("title", sa.String(length=200)),
    )
    course_slides_table = sa.table(
        "course_slides",
        sa.column("course_id", sa.Integer()),
        sa.column("order_index", sa.Integer()),
        sa.column("title", sa.String(length=200)),
        sa.column("summary", sa.Text()),
        sa.column("theory_blocks", sa.JSON()),
        sa.column("bullets", sa.JSON()),
        sa.column("example", sa.Text()),
        sa.column("practice_task", sa.Text()),
    )

    removed_course_id = connection.execute(
        sa.select(courses_table.c.id).where(courses_table.c.title == REMOVED_COURSE_TITLE)
    ).scalar_one_or_none()
    if removed_course_id is not None:
        connection.execute(sa.delete(courses_table).where(courses_table.c.id == removed_course_id))

    for course_title in TARGET_COURSE_TITLES:
        course_id = connection.execute(
            sa.select(courses_table.c.id).where(courses_table.c.title == course_title)
        ).scalar_one_or_none()
        if course_id is None:
            continue

        quiz_slide = COURSE_SLIDES_BY_TITLE[course_title][-1]

        connection.execute(
            sa.delete(course_slides_table).where(
                course_slides_table.c.course_id == course_id,
                course_slides_table.c.title == QUIZ_SLIDE_TITLE,
            )
        )

        max_order_index = connection.execute(
            sa.select(sa.func.max(course_slides_table.c.order_index)).where(course_slides_table.c.course_id == course_id)
        ).scalar_one()
        next_order_index = 0 if max_order_index is None else int(max_order_index) + 1

        connection.execute(
            sa.insert(course_slides_table).values(
                course_id=course_id,
                order_index=next_order_index,
                title=quiz_slide["title"],
                summary=quiz_slide["summary"],
                theory_blocks=quiz_slide["theory_blocks"],
                bullets=quiz_slide["bullets"],
                example=quiz_slide["example"],
                practice_task=quiz_slide["practice_task"],
            )
        )


def downgrade() -> None:
    if context.is_offline_mode():
        return

    connection = op.get_bind()

    courses_table = sa.table(
        "courses",
        sa.column("id", sa.Integer()),
        sa.column("title", sa.String(length=200)),
    )
    course_slides_table = sa.table(
        "course_slides",
        sa.column("course_id", sa.Integer()),
        sa.column("title", sa.String(length=200)),
    )

    for course_title in TARGET_COURSE_TITLES:
        course_id = connection.execute(
            sa.select(courses_table.c.id).where(courses_table.c.title == course_title)
        ).scalar_one_or_none()
        if course_id is None:
            continue

        connection.execute(
            sa.delete(course_slides_table).where(
                course_slides_table.c.course_id == course_id,
                course_slides_table.c.title == QUIZ_SLIDE_TITLE,
            )
        )
