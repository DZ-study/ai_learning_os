from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.user.repository import UserRepository
from app.modules.user.schemas import UpdateProfileRequest
from app.shared.exceptions import NotFoundException


class UserService:
    """Domain service for user-related business logic."""

    def __init__(self, db: AsyncSession, repository: UserRepository) -> None:
        self._repository = repository
        self.db = db

    async def get_profile(self, user_id: int):
        """
        获取用户信息
        """
        user = await self._repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("用户不存在")
        return {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "avatar": user.avatar,
            "created_at": user.created_at.isoformat(),
        }

    async def update_profile(self, user_id: int, profile_data: UpdateProfileRequest):
        """
        更新用户信息
        """
        # 1、查询用户是否存在
        user = await self._repository.get_by_id(user_id)

        if not user:
            raise NotFoundException("用户不存在")

        # 2、更新用户信息
        user.nickname = (
            profile_data.nickname or user.nickname
        )  # 如果 nickname 不为空，则更新用户昵称

        await self.db.commit()
        await self.db.refresh(user)  # 刷新用户对象，确保获取到最新的数据库状态

        return user
