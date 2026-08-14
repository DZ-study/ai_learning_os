from datetime import date

from sqlalchemy import JSON, Date, Float, ForeignKey, String, Text
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

    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="目标标题")
    description: Mapped[str] = mapped_column(Text, nullable=True, comment="目标描述")

    # 目标周期：1周/2周/1个月/2个月/3个月/6个月/1年/2年/3年
    period: Mapped[str] = mapped_column(String(20), nullable=False, comment="目标周期")

    # 每天投入小时数：0.5/1/1.5/2/3/4/5
    daily_hours: Mapped[float] = mapped_column(
        Float, nullable=False, comment="每天投入小时数"
    )

    # 当前水平：零基础/入门/进阶/高手
    level: Mapped[str] = mapped_column(String(20), nullable=False, comment="当前水平")

    # 偏好学习方式（多选）：视频/阅读/动手实践/刷题/案例驱动
    preference: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True, comment="偏好学习方式"
    )

    # 学习动机：找工作/升职加薪/转行/兴趣/考试考证
    motivation: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="学习动机"
    )

    # 开始日期
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # 结束日期
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # active / completed / paused
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    user = relationship("User", back_populates="goals")
