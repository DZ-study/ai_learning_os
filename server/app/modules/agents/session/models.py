from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base, TimestampMixin


class AgentSession(TimestampMixin, Base):
    __tablename__ = "agent_sessions"

    id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, comment="会话ID"
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID"
    )

    agent_type: Mapped[str] = mapped_column(
        Enum("goal_planning", "tutor", "review", name="agent_type"),
        nullable=False,
        default="goal_planning",
        comment="agent类型",
    )

    goal_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"), nullable=True, comment="目标ID"
    )

    stage: Mapped[str] = mapped_column(
        nullable=False, default="initial", comment="会话阶段"
    )

    context: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    last_message_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    execution_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    execution_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Session生命周期
    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "active",
            "paused",
            "completed",
            "failed",
            name="agent_session_status",
        ),
        nullable=False,
        default="active",
    )


class AgentMessage(TimestampMixin, Base):
    __tablename__ = "agent_messages"
    __table_args__ = (
        UniqueConstraint(
            "session_id", "sequence", name="uq_agent_messages_session_sequence"
        ),
        Index("ix_agent_messages_session_sequence", "session_id", "sequence"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("agent_sessions.id", ondelete="CASCADE"), nullable=False
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(
        String(64), nullable=False, default="text"
    )
    message_metadata: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
