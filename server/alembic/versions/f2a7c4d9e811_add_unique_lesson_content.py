"""ensure one generated content row per lesson

Revision ID: f2a7c4d9e811
Revises: e5b92c7a3f18
"""

from typing import Sequence, Union

from alembic import op


revision: str = "f2a7c4d9e811"
down_revision: Union[str, Sequence[str], None] = "e5b92c7a3f18"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_lesson_contents_lesson_id",
        "lesson_contents",
        ["lesson_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_lesson_contents_lesson_id",
        "lesson_contents",
        type_="unique",
    )
