"""add user gigachat credentials

Revision ID: 20260420_0002
Revises: 20260401_0001
Create Date: 2026-04-20 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260420_0002"
down_revision: str | None = "20260401_0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("gigachat_credentials_encrypted", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("users", "gigachat_credentials_encrypted")
