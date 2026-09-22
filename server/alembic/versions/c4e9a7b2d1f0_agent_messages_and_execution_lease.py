"""persist agent messages and session execution lease

Revision ID: c4e9a7b2d1f0
Revises: b91e3f4a7c20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c4e9a7b2d1f0"
down_revision: Union[str, Sequence[str], None] = "b91e3f4a7c20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agent_sessions", sa.Column("last_message_id", sa.Integer(), nullable=True))
    op.add_column("agent_sessions", sa.Column("execution_token", sa.String(length=64), nullable=True))
    op.add_column("agent_sessions", sa.Column("execution_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_agent_sessions_execution_token", "agent_sessions", ["execution_token"])

    op.create_table(
        "agent_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("message_type", sa.String(length=64), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["agent_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "sequence", name="uq_agent_messages_session_sequence"),
    )
    op.create_index("ix_agent_messages_session_sequence", "agent_messages", ["session_id", "sequence"])

    # Migrate the legacy JSONB message arrays before removing them from the
    # runtime context. Existing conversations therefore remain replayable.
    op.execute(
        sa.text(
            """
            INSERT INTO agent_messages
                (session_id, sequence, role, content, message_type, metadata,
                 token_count, created_at, updated_at)
            SELECT
                s.id,
                item.ordinality::integer,
                COALESCE(item.value->>'role', 'assistant'),
                COALESCE(item.value->>'content', ''),
                COALESCE(item.value->>'type', 'text'),
                CASE WHEN item.value ? 'plan'
                     THEN jsonb_build_object('plan', item.value->'plan')
                     ELSE '{}'::jsonb END,
                NULL,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM agent_sessions AS s
            CROSS JOIN LATERAL jsonb_array_elements(
                COALESCE(s.context->'messages', '[]'::jsonb)
            ) WITH ORDINALITY AS item(value, ordinality)
            WHERE s.context ? 'messages'
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE agent_sessions AS s
            SET last_message_id = latest.id,
                context = s.context - 'messages'
            FROM (
                SELECT DISTINCT ON (session_id) id, session_id
                FROM agent_messages
                ORDER BY session_id, sequence DESC
            ) AS latest
            WHERE s.id = latest.session_id
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE agent_sessions
            SET context = context - 'messages'
            WHERE context ? 'messages'
            """
        )
    )


def downgrade() -> None:
    op.drop_index("ix_agent_messages_session_sequence", table_name="agent_messages")
    op.drop_table("agent_messages")
    op.drop_index("ix_agent_sessions_execution_token", table_name="agent_sessions")
    op.drop_column("agent_sessions", "execution_expires_at")
    op.drop_column("agent_sessions", "execution_token")
    op.drop_column("agent_sessions", "last_message_id")
