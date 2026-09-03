"""
学习目标仓库 — 封装与学习目标相关的数据库操作。
"""

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.goals.models import Goals


class GoalRepository:
    def __init__(self, session) -> None:
        self.session = session

    async def create(self, data):
        goal = Goals(**data)
        self.session.add(goal)
        await self.session.flush()
        return goal

    async def get_all_by_user_id(self, user_id: int) -> list[Goals]:
        result = await self.session.execute(
            select(Goals)
            .where(Goals.user_id == user_id)
            .options(selectinload(Goals.plan))
        )
        return result.scalars().all()

    async def get_one_by_id(self, goal_id: int) -> Goals | None:
        result = await self.session.get(Goals, goal_id)
        return result
