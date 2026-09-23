from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.goals.models import (
    GoalPlan,
    GoalPlanItem,
    LearningTask,
    LessonBlockProgress,
    LessonContent,
)
from app.modules.nodes.models import SpaceNode
from app.modules.nodes.schemas import (
    CourseChapterResponse,
    CourseLessonResponse,
    CoursePlanResponse,
    NodeCreate,
    NodeResponse,
)


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
    async def to_response(db: AsyncSession, node: SpaceNode) -> NodeResponse:
        """Serialize a node and derive course data from its referenced plan."""
        course_plan = None
        if node.type == "course" and node.entity_type == "goal_plan" and node.entity_id:
            course_plan = await SpaceNodeService.get_course_plan(
                db, node.entity_id, node.goal_id, node.user_id, node.title
            )

        return NodeResponse(
            id=node.id,
            goal_id=node.goal_id,
            user_id=node.user_id,
            type=node.type,
            title=node.title,
            content=node.content or {},
            position=node.position or {},
            entity_type=node.entity_type,
            entity_id=node.entity_id,
            course_plan=course_plan,
        )

    @staticmethod
    async def get_course_plan(
        db: AsyncSession,
        plan_id: int,
        goal_id: int,
        user_id: int,
        node_title: str,
    ) -> CoursePlanResponse | None:
        plan = await db.scalar(
            select(GoalPlan).where(
                GoalPlan.id == plan_id,
                GoalPlan.goal_id == goal_id,
                GoalPlan.user_id == user_id,
            )
        )
        if plan is None:
            return None

        items = list(
            await db.scalars(
                select(GoalPlanItem)
                .where(GoalPlanItem.plan_id == plan.id)
                .order_by(GoalPlanItem.sort_order, GoalPlanItem.id)
            )
        )
        item_ids = [item.id for item in items]
        tasks = []
        if item_ids:
            tasks = list(
                await db.scalars(
                    select(LearningTask)
                    .where(
                        LearningTask.goal_id == goal_id,
                        LearningTask.user_id == user_id,
                        LearningTask.plan_item_id.in_(item_ids),
                    )
                    .order_by(LearningTask.plan_item_id, LearningTask.id)
                )
            )

        lesson_ids = [task.id for task in tasks]
        contents_by_lesson: dict[int, LessonContent] = {}
        completed_blocks_by_lesson: dict[int, set[str]] = {
            lesson_id: set() for lesson_id in lesson_ids
        }
        if lesson_ids:
            contents = await db.scalars(
                select(LessonContent).where(LessonContent.lesson_id.in_(lesson_ids))
            )
            contents_by_lesson = {content.lesson_id: content for content in contents}

            progress_rows = await db.scalars(
                select(LessonBlockProgress).where(
                    LessonBlockProgress.user_id == user_id,
                    LessonBlockProgress.lesson_id.in_(lesson_ids),
                    LessonBlockProgress.status == "completed",
                )
            )
            for row in progress_rows:
                completed_blocks_by_lesson.setdefault(row.lesson_id, set()).add(
                    row.block_id
                )

        def lesson_progress(lesson_id: int) -> int:
            content = contents_by_lesson.get(lesson_id)
            blocks = content.blocks if content else []
            required_block_ids = {
                block.get("block_id")
                for block in blocks
                if isinstance(block, dict)
                and block.get("block_id")
                and block.get("required", True)
            }
            completed_required = len(
                required_block_ids.intersection(
                    completed_blocks_by_lesson.get(lesson_id, set())
                )
            )
            return (
                round(completed_required * 100 / len(required_block_ids))
                if required_block_ids
                else 0
            )

        tasks_by_item: dict[int, list[LearningTask]] = {item.id: [] for item in items}
        for task in tasks:
            if task.plan_item_id in tasks_by_item:
                tasks_by_item[task.plan_item_id].append(task)

        chapters = []
        for item in items:
            lessons = tasks_by_item[item.id]
            chapters.append(
                CourseChapterResponse(
                    id=f"chapter-{plan.id}-{item.id}",
                    title=item.title,
                    lessons=[
                        CourseLessonResponse(
                            id=task.id,
                            title=task.title,
                            estimated_minutes=task.estimated_minutes,
                            progress=lesson_progress(task.id),
                            status=(
                                "completed"
                                if task.status == "completed"
                                else "available"
                                if not any(
                                    previous.status != "completed"
                                    for previous in lessons[:index]
                                )
                                else "locked"
                            ),
                        )
                        for index, task in enumerate(lessons)
                    ],
                )
            )

        plan_content = plan.content or {}
        return CoursePlanResponse(
            id=f"course-plan-{plan.id}",
            title=node_title,
            description=plan_content.get("summary") or node_title,
            chapters=chapters,
            status="ready",
        )
