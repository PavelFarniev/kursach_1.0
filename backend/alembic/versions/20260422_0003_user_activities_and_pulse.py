"""add user activities for learning pulse

Revision ID: 20260422_0003
Revises: 20260403_0002
Create Date: 2026-04-22 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260422_0003"
down_revision: str | None = "20260403_0002"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    timestamp_default = sa.text("CURRENT_TIMESTAMP")

    op.create_table(
        "user_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=40), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_activities_id"), "user_activities", ["id"], unique=False)
    op.create_index(op.f("ix_user_activities_user_id"), "user_activities", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_activities_course_id"), "user_activities", ["course_id"], unique=False)
    op.create_index(op.f("ix_user_activities_event_type"), "user_activities", ["event_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_activities_event_type"), table_name="user_activities")
    op.drop_index(op.f("ix_user_activities_course_id"), table_name="user_activities")
    op.drop_index(op.f("ix_user_activities_user_id"), table_name="user_activities")
    op.drop_index(op.f("ix_user_activities_id"), table_name="user_activities")
    op.drop_table("user_activities")
