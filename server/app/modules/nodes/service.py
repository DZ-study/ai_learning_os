from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.goals.models import GoalPlan, GoalPlanItem, LearningTask
from app.modules.nodes.models import SpaceNode
from app.modules.nodes.schemas import NodeCreate


class SpaceNodeService:
    """SpaceNode business operations that participate in the caller's transaction."""

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        goal_id: int,
        user_id: int,
        data: NodeCreate,
    ) -> SpaceNode:
        # Entity-backed nodes are idempotent. This also makes retries from a
        # caller safe before the database unique index is consulted.
        if data.entity_type is not None and data.entity_id is not None:
            existing = await db.scalar(
                select(SpaceNode).where(
                    SpaceNode.goal_id == goal_id,
                    SpaceNode.user_id == user_id,
                    SpaceNode.entity_type == data.entity_type,
                    SpaceNode.entity_id == data.entity_id,
                )
            )
            if existing is not None:
                return existing

        existing_positions = await db.scalars(
            select(SpaceNode.position).where(
                SpaceNode.goal_id == goal_id,
                SpaceNode.user_id == user_id,
            )
        )
        occupied = {
            (position.get("x"), position.get("y"))
            for position in existing_positions
            if isinstance(position, dict)
        }

        position = dict(data.position)
        x = position.get("x", 42)
        y = position.get("y", 78)
        while (x, y) in occupied:
            x += 360
            if x > 900:
                x = 42
                y += 220
        position.update(x=x, y=y)

        node = SpaceNode(
            goal_id=goal_id,
            user_id=user_id,
            type=data.type,
            title=data.title,
            content=data.content,
            position=position,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
        )
        db.add(node)
        await db.flush()
        return node

    @staticmethod
    async def repair_course_lesson_ids(
        db: AsyncSession,
        *,
        node: SpaceNode,
        user_id: int,
    ) -> bool:
        """Repair legacy course nodes that stored synthetic Lesson IDs."""
        if node.type != "course":
            return False

        plan_id = node.entity_id if node.entity_type == "goal_plan" else None
        if plan_id is None:
            plan_id = await db.scalar(
                select(GoalPlan.id)
                .where(
                    GoalPlan.goal_id == node.goal_id,
                    GoalPlan.user_id == user_id,
                    GoalPlan.status == "active",
                )
                .order_by(GoalPlan.version.desc())
                .limit(1)
            )
        if plan_id is None:
            return False

        items = list(
            await db.scalars(
                select(GoalPlanItem)
                .where(GoalPlanItem.plan_id == plan_id)
                .order_by(GoalPlanItem.sort_order, GoalPlanItem.id)
            )
        )
        if not items:
            return False

        tasks = list(
            await db.scalars(
                select(LearningTask)
                .where(
                    LearningTask.goal_id == node.goal_id,
                    LearningTask.user_id == user_id,
                    LearningTask.plan_item_id.in_([item.id for item in items]),
                )
                .order_by(LearningTask.plan_item_id, LearningTask.id)
            )
        )
        tasks_by_item: dict[int, list[LearningTask]] = {item.id: [] for item in items}
        for task in tasks:
            if task.plan_item_id in tasks_by_item:
                tasks_by_item[task.plan_item_id].append(task)

        content = dict(node.content or {})
        chapters = content.get("chapters")
        if not isinstance(chapters, list):
            return False

        changed = False
        for chapter_index, chapter in enumerate(chapters):
            if chapter_index >= len(items) or not isinstance(chapter, dict):
                continue
            lessons = chapter.get("lessons")
            if not isinstance(lessons, list):
                continue
            chapter_tasks = tasks_by_item[items[chapter_index].id]
            for lesson_index, lesson in enumerate(lessons):
                if lesson_index >= len(chapter_tasks) or not isinstance(lesson, dict):
                    continue
                real_id = chapter_tasks[lesson_index].id
                if lesson.get("id") != real_id:
                    lesson["id"] = real_id
                    changed = True

        if changed:
            node.content = content
        return changed
