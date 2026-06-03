"""add course slides and seed course content

Revision ID: 20260403_0002
Revises: 20260401_0001
Create Date: 2026-04-03 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import context, op
import sqlalchemy as sa

from app.services.course_service import COURSE_SEED_DATA, COURSE_SLIDES_BY_TITLE

# revision identifiers, used by Alembic.
revision: str = "20260403_0002"
down_revision: str | None = "20260401_0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    timestamp_default = sa.text("CURRENT_TIMESTAMP")

    op.create_table(
        "course_slides",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("theory_blocks", sa.JSON(), nullable=False),
        sa.Column("bullets", sa.JSON(), nullable=False),
        sa.Column("example", sa.Text(), nullable=False),
        sa.Column("practice_task", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_course_slides_id"), "course_slides", ["id"], unique=False)
    op.create_index(op.f("ix_course_slides_course_id"), "course_slides", ["course_id"], unique=False)

    if context.is_offline_mode():
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

    existing_courses_by_title = {
        row.title: row.id
        for row in connection.execute(sa.select(courses_table.c.id, courses_table.c.title))
    }

    missing_courses = [course for course in COURSE_SEED_DATA if course["title"] not in existing_courses_by_title]
    if missing_courses:
        op.bulk_insert(courses_table, missing_courses)
        existing_courses_by_title = {
            row.title: row.id
            for row in connection.execute(sa.select(courses_table.c.id, courses_table.c.title))
        }

    slides_to_insert: list[dict[str, object]] = []

    for course_title, raw_slides in COURSE_SLIDES_BY_TITLE.items():
        course_id = existing_courses_by_title.get(course_title)
        if course_id is None:
            continue

        existing_slide = connection.execute(
            sa.select(course_slides_table.c.course_id).where(course_slides_table.c.course_id == course_id).limit(1)
        ).first()

        if existing_slide is not None:
            continue

        for order_index, slide in enumerate(raw_slides):
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
    op.drop_index(op.f("ix_course_slides_course_id"), table_name="course_slides")
    op.drop_index(op.f("ix_course_slides_id"), table_name="course_slides")
    op.drop_table("course_slides")
