from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.ai.service import LLMService
from app.modules.goals.models import Goals
from app.modules.goals.repository import GoalRepository
from app.modules.goals.schemas import (
    GoalCreate,
)
from app.shared.exceptions import NotFoundException


class GoalService:
    def __init__(
        self, session: AsyncSession, repository: GoalRepository, ai_service: LLMService
    ):
        self.session = session
        self._repository = repository
        self.ai_service = ai_service

    async def create_goal(self, user_id: int, data: GoalCreate):
        goal_data = data.model_dump()
        goal_data["user_id"] = user_id
        goal = await self._repository.create(goal_data)
        try:
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise

        result = await self.session.execute(
            select(Goals).options(selectinload(Goals.plan)).where(Goals.id == goal.id)
        )
        return result.scalar_one()

    async def get_goals(self, user_id: int):
        result = await self._repository.get_all_by_user_id(user_id)
        return result

    async def get_goal(self, goal_id: int, user_id: int):
        result = await self._repository.get_one_by_id(
            goal_id=goal_id,
            user_id=user_id,
        )
        if not result:
            raise NotFoundException("目标不存在")
        return result

    async def delete_goal(self, goal_id: int, user_id: int) -> None:
        goal = await self._repository.get_one_by_id(
            goal_id=goal_id,
            user_id=user_id,
        )
        if not goal:
            raise NotFoundException("目标不存在")

        # Delete the parent row directly so PostgreSQL applies the existing
        # ON DELETE CASCADE constraints.  Using session.delete(goal) here
        # makes SQLAlchemy null out the loaded one-to-one plan relationship
        # before deleting the goal, but goal_plans.goal_id is NOT NULL.
        await self.session.execute(delete(Goals).where(Goals.id == goal_id))
        try:
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise

    # async def parse_goal(self, messages: str):
    # result = await self.ai_service.parse_goal(messages)
    # return result

    # TODO
    async def start_goal(self, goal_id: int, user_id: int):
        pass
