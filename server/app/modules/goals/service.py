from fastapi import HTTPException, status

from app.infrastructure.ai.service import LLMService
from app.modules.goals.repository import GoalRepository
from app.modules.goals.schemas import (
    GoalCreate,
)


class GoalService:
    def __init__(self, repository: GoalRepository, ai_service: LLMService):
        self._repository = repository
        self.ai_service = ai_service

    async def create_goal(self, user_id: int, data: GoalCreate):
        goal_data = data.model_dump()
        goal_data["user_id"] = user_id
        goal = await self._repository.create(goal_data)
        return goal

    async def get_goals(self, user_id: int):
        result = await self._repository.get_all_by_user_id(user_id)
        return result

    async def get_goal(self, goal_id: int):
        result = await self._repository.get_one_by_id(goal_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return result

    async def parse_goal(self, messages: str):
        result = await self.ai_service.parse_goal(messages)
        return result
