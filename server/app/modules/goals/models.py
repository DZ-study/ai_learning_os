from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text
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


# 目标计划
class GoalPlan(TimestampMixin, Base):
    __tablename__ = "goal_plans"

    id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, comment="目标计划ID"
    )
    goal_id: Mapped[int] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, comment="目标ID"
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID"
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    content: Mapped[JSONB] = mapped_column(JSONB, nullable=False, comment="计划内容")

    status: Mapped[str] = mapped_column(
        Enum(
            "pending_confirmation",  # 未确认
            "active",  # 进行中
            "superseded",  # 取消
            name="goal_plan_status",
        ),
        nullable=False,
        default="pending_confirmation",
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    items = relationship(
        "GoalPlanItem", back_populates="plan", cascade="all, delete-orphan"
    )


# 目标阶段
class GoalPlanItem(TimestampMixin, Base):
    __tablename__ = "goal_plan_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    plan_id: Mapped[int] = mapped_column(
        ForeignKey("goal_plans.id", ondelete="CASCADE"), nullable=False
    )

    # 阶段序号
    phase: Mapped[int] = mapped_column(Integer, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    objective: Mapped[str] = mapped_column(Text, nullable=False)

    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    # Python中order是内置函数名，不建议作为属性名
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    status: Mapped[str] = mapped_column(
        Enum(
            "pending",  # 未开始
            "in_progress",  # 进行中
            "completed",  # 完成
            name="goal_plan_item_status",
        ),
        nullable=False,
        default="pending",
    )

    plan = relationship("GoalPlan", back_populates="items")


# 学习任务
class LearningTask(TimestampMixin, Base):
    __tablename__ = "learning_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    goal_id: Mapped[int] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"), nullable=False
    )

    plan_item_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("goal_plan_items.id", ondelete="SET NULL"), nullable=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    task_date: Mapped[date] = mapped_column(Date, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(
        Enum(
            "pending",  # 未开始
            "in_progress",  # 进行中
            "completed",  # 完成
            name="learning_task_status",
        ),
        nullable=False,
        default="pending",
    )


class GoalAgentSession(TimestampMixin, Base):
    __tablename__ = "goal_agent_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    goal_id: Mapped[int] = mapped_column(
        ForeignKey("goals.id", ondelete="CASCADE"), nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    stage: Mapped[str] = mapped_column(
        String(50), nullable=False, default="collecting_info"
    )

    # 保存Agent收集到的信息
    context: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # LLM生成但用户还没确认的计划
    pending_plan: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    last_question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
