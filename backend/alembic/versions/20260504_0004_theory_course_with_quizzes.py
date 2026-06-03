"""add theory course with module quizzes

Revision ID: 20260504_0004
Revises: 20260422_0003
Create Date: 2026-05-04 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import context, op
import sqlalchemy as sa

from app.services.course_service import COURSE_SEED_DATA, COURSE_SLIDES_BY_TITLE

# revision identifiers, used by Alembic.
revision: str = "20260504_0004"
down_revision: str | None = "20260422_0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

TARGET_TITLE = "Теория и аналитика платформ подготовки к экзаменам"


def _course_payload() -> dict[str, object] | None:
    return next((course for course in COURSE_SEED_DATA if course["title"] == TARGET_TITLE), None)


def upgrade() -> None:
    if context.is_offline_mode():
        return

    course_payload = _course_payload()
    slides = COURSE_SLIDES_BY_TITLE.get(TARGET_TITLE)
    if course_payload is None or not slides:
        return

    connection = op.get_bind()

    courses_table = sa.table(
        "courses",
        sa.column("id", sa.Integer()),
        sa.column("title", sa.String(length=200)),
        sa.column("description", sa.Text()),
        sa.column("category", sa.String(length=80)),
        sa.column("level", sa.String(length=40)),
        sa.column("lessons_count", sa.Integer()),
        sa.column("estimated_hours", sa.Integer()),
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

    course_id = connection.execute(
        sa.select(courses_table.c.id).where(courses_table.c.title == TARGET_TITLE)
    ).scalar_one_or_none()

    if course_id is None:
        op.bulk_insert(courses_table, [course_payload])
        course_id = connection.execute(
            sa.select(courses_table.c.id).where(courses_table.c.title == TARGET_TITLE)
        ).scalar_one()

    existing_slide_titles = {
        row.title
        for row in connection.execute(
            sa.select(course_slides_table.c.title).where(course_slides_table.c.course_id == course_id)
        )
    }

    slides_to_insert: list[dict[str, object]] = []
    for order_index, slide in enumerate(slides):
        if slide["title"] in existing_slide_titles:
            continue

        slides_to_insert.append(
            {
                "course_id": course_id,
                "order_index": order_index,
                "title": slide["title"],
                "summary": slide["summary"],
                "theory_blocks": slide["theory_blocks"],
                "bullets": slide["bullets"],
                "example": slide["example"],
                "practice_task": slide["practice_task"],
            }
        )

    if slides_to_insert:
        op.bulk_insert(course_slides_table, slides_to_insert)


def downgrade() -> None:
    if context.is_offline_mode():
        return

    connection = op.get_bind()
    courses = sa.table(
        "courses",
        sa.column("id", sa.Integer()),
        sa.column("title", sa.String(length=200)),
    )
    course_slides = sa.table(
        "course_slides",
        sa.column("course_id", sa.Integer()),
    )

    course_id = connection.execute(
        sa.select(courses.c.id).where(courses.c.title == TARGET_TITLE)
    ).scalar_one_or_none()

    if course_id is None:
        return

    connection.execute(sa.delete(course_slides).where(course_slides.c.course_id == course_id))
    connection.execute(sa.delete(courses).where(courses.c.id == course_id))
