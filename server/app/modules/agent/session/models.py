from typing import Optional

from sqlalchemy import Enum, ForeignKey
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
