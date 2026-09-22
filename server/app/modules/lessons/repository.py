"""
课时仓库 — 封装与课时（LearningTask）及课时内容相关的数据库操作。
"""
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.modules.agents.session.models import AgentSession
from app.modules.goals.models import (
    GoalPlan,
    GoalPlanItem,
    Goals,
    LearningTask,
    LessonBlockProgress,
    LessonContent,
)


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

    async def get_active_plan(self, goal_id: int, user_id: int) -> GoalPlan | None:
        result = await self.session.execute(
            select(GoalPlan).where(
                GoalPlan.goal_id == goal_id,
                GoalPlan.user_id == user_id,
                GoalPlan.status == "active",
            )
        )
        return result.scalar_one_or_none()

    async def get_recent_context(
        self, *, user_id: int, goal_id: int, limit: int = 4
    ) -> dict:
        result = await self.session.execute(
            select(AgentSession)
            .where(
                AgentSession.user_id == user_id,
                AgentSession.goal_id == goal_id,
                AgentSession.agent_type == "goal_planning",
            )
            .order_by(AgentSession.updated_at.desc())
            .limit(1)
        )
        session = result.scalar_one_or_none()
        if session is None:
            return {}
        context = dict(session.context or {})
        messages = context.get("messages") or []
        return {
            "recent_messages": messages[-limit:],
            "current_level": context.get("current_level"),
            "learning_preference": context.get("learning_preference"),
        }

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
        now = datetime.utcnow()
        task.status = status
        if status == "in_progress" and task.started_at is None:
            task.started_at = now
        task.completed_at = now if status == "completed" else None
        task.last_accessed_at = now
        await self.session.flush()
        return task

    async def start_task(self, task: LearningTask) -> LearningTask:
        now = datetime.utcnow()
        if task.status == "not_started":
            task.status = "in_progress"
            task.started_at = now
        task.last_accessed_at = now
        await self.session.flush()
        return task

    async def get_block_progress(
        self, lesson_id: int, user_id: int
    ) -> list[LessonBlockProgress]:
        result = await self.session.execute(
            select(LessonBlockProgress).where(
                LessonBlockProgress.lesson_id == lesson_id,
                LessonBlockProgress.user_id == user_id,
            )
        )
        return list(result.scalars().all())

    async def complete_block(
        self, lesson_id: int, user_id: int, block_id: str
    ) -> None:
        now = datetime.utcnow()
        statement = (
            insert(LessonBlockProgress)
            .values(
                user_id=user_id,
                lesson_id=lesson_id,
                block_id=block_id,
                status="completed",
                started_at=now,
                completed_at=now,
                created_at=now,
                updated_at=now,
            )
            .on_conflict_do_update(
                constraint="uq_lesson_block_progress_user_lesson_block",
                set_={
                    "status": "completed",
                    "started_at": func.coalesce(
                        LessonBlockProgress.started_at, now
                    ),
                    "completed_at": func.coalesce(
                        LessonBlockProgress.completed_at, now
                    ),
                    "updated_at": now,
                },
            )
        )
        await self.session.execute(statement)
