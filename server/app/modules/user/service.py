from app.modules.user.repository import UserRepository
from app.shared.exceptions import NotFoundException


class UserService:
    """Domain service for user-related business logic."""

    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

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
