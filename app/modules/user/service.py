from app.modules.user.repository import UserRepository


class UserService:
    """Domain service for user-related business logic."""

    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository
