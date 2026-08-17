from datetime import date
from typing import Any, Optional

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database.base import Base, TimestampMixin


class Goals(TimestampMixin, Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, comment="目标ID"
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID"
    )

    # 用户必填
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="目标标题")
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="目标描述"
    )
    duration: Mapped[int] = mapped_column(nullable=True)

    # 用户可选、可修改
    available_time: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(
        Enum("low", "medium", "high", name="goal_priority"),
        nullable=True,
        index=True,
        comment="优先级",
    )
    preferences: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    constraints: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # rawInput: Mapped[Optional[str]] = mapped_column(
    #     Text, nullable=True, comment="原始输入"
    # )

    # # AI灵活上下文
    # ai_context: Mapped[Optional[dict[str, Any]]] = mapped_column(
    #     JSONB, nullable=True, comment="ai上下文"
    # )

    status: Mapped[str] = mapped_column(
        Enum(
            "draft",  # 未开始
            "active",  # 进行中
            "paused",  # 暂停
            "completed",  # 完成
            "archived",  # 归档
            name="goal_status",
        ),
        nullable=False,
        default="draft",
        index=True,
    )

    user = relationship("User", back_populates="goals")
