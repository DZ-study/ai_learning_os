"""
生成验证码
保存验证码
校验验证码
"""

from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import AuthAccount, VerificationCode
from app.modules.user.models import User


class AuthRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # 根据邮箱查询用户
    async def get_user_by_email(self, email: EmailStr) -> User | None:

        result = await self.session.execute(select(User).where(User.email == email))

        return result.scalar_one_or_none()  # 返回单个对象

    # 根据邮箱查询验证码
    async def get_verification_code(self, email: EmailStr) -> VerificationCode | None:

        result = await self.session.execute(
            select(VerificationCode)
            .where(VerificationCode.email == email)
            .order_by(VerificationCode.created_at.desc())
        )

        return result.scalar_one_or_none()

    # 标记验证码已使用
    async def mark_code_used(self, code: VerificationCode):

        code.used = True

        await self.session.flush()

    async def create_auth_account(self, user_id: int, provider: str, email: EmailStr):

        auth_account = AuthAccount(user_id=user_id, provider=provider, email=email)

        self.session.add(auth_account)

        await self.session.flush()

        return auth_account
