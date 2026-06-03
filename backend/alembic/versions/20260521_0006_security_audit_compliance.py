"""merge heads and add DB compliance triggers/checks

Revision ID: 20260521_0006
Revises: 20260504_0005, 20260420_0002
Create Date: 2026-05-21 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260521_0006"
down_revision: tuple[str, str] = ("20260504_0005", "20260420_0002")
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

TIMESTAMPED_TABLES = [
    "users",
    "courses",
    "sessions",
    "password_resets",
    "enrollments",
    "course_notes",
    "feedback_tickets",
    "ai_chat_sessions",
    "ai_chat_messages",
    "course_slides",
    "user_activities",
]


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    for table_name in TIMESTAMPED_TABLES:
        op.execute(
            f"""
            DROP TRIGGER IF EXISTS trg_{table_name}_set_updated_at ON {table_name};
            CREATE TRIGGER trg_{table_name}_set_updated_at
            BEFORE UPDATE ON {table_name}
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at_timestamp();
            """
        )

    op.create_check_constraint(
        "ck_courses_lessons_count_non_negative",
        "courses",
        "lessons_count >= 0",
    )
    op.create_check_constraint(
        "ck_courses_estimated_hours_non_negative",
        "courses",
        "estimated_hours >= 0",
    )
    op.create_check_constraint(
        "ck_course_slides_order_index_non_negative",
        "course_slides",
        "order_index >= 0",
    )
    op.create_check_constraint(
        "ck_enrollments_progress_percent_range",
        "enrollments",
        "progress_percent BETWEEN 0 AND 100",
    )
    op.create_check_constraint(
        "ck_user_activities_value_positive",
        "user_activities",
        "value > 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_user_activities_value_positive",
        "user_activities",
        type_="check",
    )
    op.drop_constraint(
        "ck_enrollments_progress_percent_range",
        "enrollments",
        type_="check",
    )
    op.drop_constraint(
        "ck_course_slides_order_index_non_negative",
        "course_slides",
        type_="check",
    )
    op.drop_constraint(
        "ck_courses_estimated_hours_non_negative",
        "courses",
        type_="check",
    )
    op.drop_constraint(
        "ck_courses_lessons_count_non_negative",
        "courses",
        type_="check",
    )

    for table_name in TIMESTAMPED_TABLES:
        op.execute(
            f"DROP TRIGGER IF EXISTS trg_{table_name}_set_updated_at ON {table_name};"
        )

    op.execute("DROP FUNCTION IF EXISTS set_updated_at_timestamp();")
