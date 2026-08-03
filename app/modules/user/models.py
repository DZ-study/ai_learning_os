from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base, TimestampMixin


class User(TimestampMixin, Base):
  __tablename__ = "users"

  id: Mapped[int] = mapped_column(
    primary_key=True,
    autoincrement=True,
    comment="用户ID"
  )

  email: Mapped[str] = mapped_column(
    String(255),
    nullable=False,
    unique=True,
    comment="邮箱"
  )

  nickname: Mapped[str | None] = mapped_column(
    String(50),
    nullable=True, # 允许为空
    comment="用户昵称"
  )

  avatar: Mapped[str | None] = mapped_column(
    String(255),
    nullable=True, # 允许为空
    comment="用户头像"
  )

  status: Mapped[str] = mapped_column(
      String(20),
      default="active"
  )

