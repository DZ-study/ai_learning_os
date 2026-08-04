"""
用户仓库 — 封装用户表的数据库操作。
"""

from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.user.models import User


class UserRepository:
    """用户数据访问层。"""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, email: EmailStr) -> User:
        """创建用户（仅 flush，不提交事务——事务由 service 层控制）。"""
        user = User(email=email)
        self.session.add(user)
        await self.session.flush()
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        # get根据主键查询，会触发一级缓存，若已存在则直接返回，不会再查询数据库
        result = await self.session.get(User, user_id)
        return result
