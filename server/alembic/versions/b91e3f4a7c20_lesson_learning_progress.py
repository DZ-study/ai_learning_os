"""persist lesson and block learning progress

Revision ID: b91e3f4a7c20
Revises: f2a7c4d9e811, g8d52e1f4c97
Create Date: 2026-09-21 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b91e3f4a7c20"
down_revision: Union[str, Sequence[str], None] = (
    "f2a7c4d9e811",
    "g8d52e1f4c97",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE learning_task_status RENAME VALUE 'pending' TO 'not_started'"
    )
    op.add_column(
        "learning_tasks", sa.Column("started_at", sa.DateTime(), nullable=True)
    )
    op.add_column(
        "learning_tasks", sa.Column("last_accessed_at", sa.DateTime(), nullable=True)
    )

    op.create_table(
        "lesson_block_progress",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("lesson_id", sa.Integer(), nullable=False),
        sa.Column("block_id", sa.String(length=64), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "in_progress",
                "completed",
                name="lesson_block_progress_status",
            ),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="创建时间",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="更新时间",
        ),
        sa.ForeignKeyConstraint(
            ["lesson_id"], ["learning_tasks.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "lesson_id",
            "block_id",
            name="uq_lesson_block_progress_user_lesson_block",
        ),
    )
    op.create_index(
        op.f("ix_lesson_block_progress_lesson_id"),
        "lesson_block_progress",
        ["lesson_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_lesson_block_progress_user_id"),
        "lesson_block_progress",
        ["user_id"],
        unique=False,
    )

    # Existing content predates persistent block identifiers. Backfill a stable,
    # deterministic identifier based on the immutable content row and block order.
    op.execute(
        """
        UPDATE lesson_contents AS content
        SET blocks = COALESCE(
            (
                SELECT jsonb_agg(
                    block.value
                    || CASE
                        WHEN block.value ? 'block_id' THEN '{}'::jsonb
                        ELSE jsonb_build_object(
                            'block_id',
                            'legacy-' || content.id::text || '-'
                                || block.ordinality::text
                        )
                    END
                    || CASE
                        WHEN block.value ? 'required' THEN '{}'::jsonb
                        ELSE jsonb_build_object('required', true)
                    END
                    ORDER BY block.ordinality
                )
                FROM jsonb_array_elements(content.blocks)
                    WITH ORDINALITY AS block(value, ordinality)
            ),
            '[]'::jsonb
        )
        WHERE jsonb_typeof(content.blocks) = 'array'
        """
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_lesson_block_progress_user_id"),
        table_name="lesson_block_progress",
    )
    op.drop_index(
        op.f("ix_lesson_block_progress_lesson_id"),
        table_name="lesson_block_progress",
    )
    op.drop_table("lesson_block_progress")
    sa.Enum(name="lesson_block_progress_status").drop(op.get_bind(), checkfirst=True)

    op.drop_column("learning_tasks", "last_accessed_at")
    op.drop_column("learning_tasks", "started_at")
    op.execute(
        "ALTER TYPE learning_task_status RENAME VALUE 'not_started' TO 'pending'"
    )
