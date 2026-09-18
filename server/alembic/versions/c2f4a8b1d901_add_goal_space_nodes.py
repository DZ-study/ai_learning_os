"""add goal space nodes

Revision ID: c2f4a8b1d901
Revises: a6dc145a1c0a
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "c2f4a8b1d901"
down_revision: Union[str, Sequence[str], None] = "a6dc145a1c0a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    node_type = postgresql.ENUM(
        "course",
        "note",
        "document",
        name="space_node_type",
    )
    table_node_type = postgresql.ENUM(
        "course",
        "note",
        "document",
        name="space_node_type",
        create_type=False,
        _create_events=False,
    )
    node_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "space_nodes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("goal_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", table_node_type, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("position", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_space_nodes_goal_id", "space_nodes", ["goal_id"])
    op.create_index("ix_space_nodes_user_id", "space_nodes", ["user_id"])
    op.create_index("ix_space_nodes_type", "space_nodes", ["type"])


def downgrade() -> None:
    op.drop_index("ix_space_nodes_type", table_name="space_nodes")
    op.drop_index("ix_space_nodes_user_id", table_name="space_nodes")
    op.drop_index("ix_space_nodes_goal_id", table_name="space_nodes")
    op.drop_table("space_nodes")
    sa.Enum("course", "note", "document", name="space_node_type").drop(
        op.get_bind(), checkfirst=True
    )
