"""
课时仓库 — 封装与课时（LearningTask）及课时内容相关的数据库操作。
"""
from datetime import datetime, timezone

from sqlalchemy import select

from app.modules.goals.models import GoalPlanItem, Goals, LearningTask, LessonContent


class LessonRepository:
    def __init__(self, session) -> None:
        self.session = session

    async def get_task(self, lesson_id: int, user_id: int) -> LearningTask | None:
        result = await self.session.execute(
            select(LearningTask).where(
                LearningTask.id == lesson_id,
                LearningTask.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_goal(self, goal_id: int) -> Goals | None:
        result = await self.session.execute(select(Goals).where(Goals.id == goal_id))
        return result.scalar_one_or_none()

    async def get_plan_item(self, plan_item_id: int) -> GoalPlanItem | None:
        result = await self.session.execute(
            select(GoalPlanItem).where(GoalPlanItem.id == plan_item_id)
        )
        return result.scalar_one_or_none()

    async def get_content(self, lesson_id: int) -> LessonContent | None:
        result = await self.session.execute(
            select(LessonContent).where(LessonContent.lesson_id == lesson_id)
        )
        return result.scalar_one_or_none()

    async def create_content(self, lesson_id: int, blocks: list) -> LessonContent:
        content = LessonContent(lesson_id=lesson_id, blocks=blocks)
        self.session.add(content)
        await self.session.flush()
        return content

    async def update_task_status(self, task: LearningTask, status: str) -> LearningTask:
        task.status = status
        task.completed_at = (
            datetime.now(timezone.utc) if status == "completed" else None
        )
        await self.session.flush()
        return task
