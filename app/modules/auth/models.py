from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base, TimestampMixin


class AuthAccount(TimestampMixin, Base):
  __tablename__ = "auth"

  id: Mapped[int] = mapped_column(
    primary_key=True,
    autoincrement=True,
    comment="账 号ID"
  )

  user_id: Mapped[int] = mapped_column(
    ForeignKey( # 外键
      "users.id",
      ondelete="CASCADE" # 级联删除
    ),
    nullable=False,
    comment="用户ID"
  )

  provider: Mapped[str] = mapped_column(
      String(30),
      nullable=False,
      comment="登录方式 email/google/wechat"
  )

  provider_account_id: Mapped[str | None] = mapped_column(
      String(255),
      nullable=True,
      comment="第三方账号唯一ID"
  )

  email: Mapped[str | None] = mapped_column(
      String(255),
      nullable=True,
      comment="邮箱"
  )

  # 创建索引
  __table_args__ = (
    Index(
      "idx_auth_provider_account",
      "provider",
      "provider_account_id",
      unique=True
    ),
    Index(
        "idx_auth_email",
        "email"
    )
  )



class VerificationCode(TimestampMixin, Base):
    __tablename__ = "verification_codes"


    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        comment="验证码ID"
    )


    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="邮箱"
    )


    code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="验证码"
    )


    type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="login",
        comment="验证码类型"
    )


    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        comment="过期时间"
    )


    used: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="是否使用"
    )


    __table_args__ = (
        Index(
            "idx_verification_email_code",
            "email",
            "code"
        ),
    )


