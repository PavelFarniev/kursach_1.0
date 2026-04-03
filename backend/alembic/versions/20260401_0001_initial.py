"""initial schema

Revision ID: 20260401_0001
Revises:
Create Date: 2026-04-01 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260401_0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    timestamp_default = sa.text("CURRENT_TIMESTAMP")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("level", sa.String(length=40), nullable=False),
        sa.Column("lessons_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estimated_hours", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_courses_category"), "courses", ["category"], unique=False)
    op.create_index(op.f("ix_courses_id"), "courses", ["id"], unique=False)
    op.create_index(op.f("ix_courses_level"), "courses", ["level"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("refresh_token_hash", sa.String(length=255), nullable=False),
        sa.Column("user_agent", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("ip_address", sa.String(length=45), nullable=False, server_default=""),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sessions_id"), "sessions", ["id"], unique=False)
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)

    op.create_table(
        "password_resets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_password_resets_id"), "password_resets", ["id"], unique=False)
    op.create_index(op.f("ix_password_resets_user_id"), "password_resets", ["user_id"], unique=False)

    op.create_table(
        "enrollments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id", name="uq_enrollments_user_course"),
    )
    op.create_index(op.f("ix_enrollments_course_id"), "enrollments", ["course_id"], unique=False)
    op.create_index(op.f("ix_enrollments_id"), "enrollments", ["id"], unique=False)
    op.create_index(op.f("ix_enrollments_user_id"), "enrollments", ["user_id"], unique=False)

    op.create_table(
        "course_notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_course_notes_course_id"), "course_notes", ["course_id"], unique=False)
    op.create_index(op.f("ix_course_notes_id"), "course_notes", ["id"], unique=False)
    op.create_index(op.f("ix_course_notes_user_id"), "course_notes", ["user_id"], unique=False)

    op.create_table(
        "feedback_tickets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("subject", sa.String(length=160), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_feedback_tickets_id"), "feedback_tickets", ["id"], unique=False)
    op.create_index(op.f("ix_feedback_tickets_user_id"), "feedback_tickets", ["user_id"], unique=False)

    op.create_table(
        "ai_chat_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=140), nullable=False, server_default="Course Assistant"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_chat_sessions_course_id"), "ai_chat_sessions", ["course_id"], unique=False)
    op.create_index(op.f("ix_ai_chat_sessions_id"), "ai_chat_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_ai_chat_sessions_user_id"), "ai_chat_sessions", ["user_id"], unique=False)

    op.create_table(
        "ai_chat_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("chat_session_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=timestamp_default, nullable=False),
        sa.ForeignKeyConstraint(["chat_session_id"], ["ai_chat_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_chat_messages_chat_session_id"), "ai_chat_messages", ["chat_session_id"], unique=False)
    op.create_index(op.f("ix_ai_chat_messages_id"), "ai_chat_messages", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_chat_messages_id"), table_name="ai_chat_messages")
    op.drop_index(op.f("ix_ai_chat_messages_chat_session_id"), table_name="ai_chat_messages")
    op.drop_table("ai_chat_messages")

    op.drop_index(op.f("ix_ai_chat_sessions_user_id"), table_name="ai_chat_sessions")
    op.drop_index(op.f("ix_ai_chat_sessions_id"), table_name="ai_chat_sessions")
    op.drop_index(op.f("ix_ai_chat_sessions_course_id"), table_name="ai_chat_sessions")
    op.drop_table("ai_chat_sessions")

    op.drop_index(op.f("ix_feedback_tickets_user_id"), table_name="feedback_tickets")
    op.drop_index(op.f("ix_feedback_tickets_id"), table_name="feedback_tickets")
    op.drop_table("feedback_tickets")

    op.drop_index(op.f("ix_course_notes_user_id"), table_name="course_notes")
    op.drop_index(op.f("ix_course_notes_id"), table_name="course_notes")
    op.drop_index(op.f("ix_course_notes_course_id"), table_name="course_notes")
    op.drop_table("course_notes")

    op.drop_index(op.f("ix_enrollments_user_id"), table_name="enrollments")
    op.drop_index(op.f("ix_enrollments_id"), table_name="enrollments")
    op.drop_index(op.f("ix_enrollments_course_id"), table_name="enrollments")
    op.drop_table("enrollments")

    op.drop_index(op.f("ix_password_resets_user_id"), table_name="password_resets")
    op.drop_index(op.f("ix_password_resets_id"), table_name="password_resets")
    op.drop_table("password_resets")

    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_id"), table_name="sessions")
    op.drop_table("sessions")

    op.drop_index(op.f("ix_courses_level"), table_name="courses")
    op.drop_index(op.f("ix_courses_id"), table_name="courses")
    op.drop_index(op.f("ix_courses_category"), table_name="courses")
    op.drop_table("courses")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
