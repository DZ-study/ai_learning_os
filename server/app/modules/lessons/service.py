"""
课时内容服务 — 查询或调用 LLM 生成课时的结构化学习内容。
"""

from pydantic import TypeAdapter, ValidationError
from sqlalchemy.exc import IntegrityError

from app.modules.agents.workflow.tutor.schemas import TutorLessonContext
from app.modules.agents.workflow.tutor.worker import TutorWorker
from app.modules.goals.models import LearningTask, LessonContent
from app.modules.lessons.repository import LessonRepository
from app.modules.lessons.schemas import (
    LessonBlock,
    LessonContentNotGenerated,
    LessonContentResponse,
    LessonInfoResponse,
    LessonStatus,
)
from app.shared.exceptions import (
    BadRequestException,
    NotFoundException,
)

_status_adapter: TypeAdapter[LessonStatus] = TypeAdapter(LessonStatus)


class LessonService:
    def __init__(
        self,
        session,
        repository: LessonRepository,
        tutor_worker: TutorWorker | None = None,
        ai_service=None,
    ) -> None:
        self.session = session
        self._repository = repository
        self._tutor_worker = tutor_worker or TutorWorker(ai_service)

    async def get_content(
        self, lesson_id: int, user_id: int
    ) -> LessonContentResponse | LessonContentNotGenerated:
        task = await self._get_owned_task(lesson_id, user_id)
        content = await self._repository.get_content(lesson_id)
        if not content:
            return LessonContentNotGenerated()
        return self._to_response(task, content)

    async def generate_content(
        self, lesson_id: int, user_id: int
    ) -> LessonContentResponse:
        task = await self._get_owned_task(lesson_id, user_id)

        existing = await self._repository.get_content(lesson_id)
        if existing:
            return self._to_response(task, existing)

        goal = await self._repository.get_goal(task.goal_id)
        plan_item = (
            await self._repository.get_plan_item(task.plan_item_id)
            if task.plan_item_id
            else None
        )
        get_active_plan = getattr(self._repository, "get_active_plan", None)
        plan = (
            await get_active_plan(task.goal_id, user_id)
            if get_active_plan
            else None
        )
        get_recent_context = getattr(self._repository, "get_recent_context", None)
        learning_context = (
            await get_recent_context(user_id=user_id, goal_id=task.goal_id)
            if get_recent_context
            else {}
        )

        generated = await self._tutor_worker.generate(
            TutorLessonContext(
                goal={
                    "title": goal.title if goal else "",
                    "description": goal.description if goal else None,
                    "duration": goal.duration if goal else None,
                    "available_time": goal.available_time if goal else None,
                },
                plan={
                    "id": plan.id if plan else None,
                    "version": plan.version if plan else None,
                    "summary": (plan.content or {}).get("summary") if plan else None,
                },
                chapter={
                    "id": plan_item.id if plan_item else None,
                    "title": plan_item.title if plan_item else "",
                    "objective": plan_item.objective if plan_item else "",
                },
                lesson={
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "estimated_minutes": task.estimated_minutes,
                    "status": task.status,
                },
                learning_context={
                    "lesson_status": task.status,
                    **learning_context,
                },
            )
        )

        try:
            content = await self._repository.create_content(
                lesson_id=task.id,
                blocks=[
                    LessonBlock(
                        **block.model_dump(),
                        order=order,
                    ).model_dump()
                    for order, block in enumerate(generated.blocks, start=1)
                ],
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            existing = await self._repository.get_content(lesson_id)
            if existing:
                return self._to_response(task, existing)
            raise
        return self._to_response(task, content)

    async def get_lesson_info(self, lesson_id: int, user_id: int) -> LessonInfoResponse:
        task = await self._get_owned_task(lesson_id, user_id)
        return LessonInfoResponse.model_validate(task)

    async def update_lesson_status(
        self, lesson_id: int, user_id: int, status: str
    ) -> LessonInfoResponse:
        try:
            validated = _status_adapter.validate_python(status)
        except ValidationError as e:
            raise BadRequestException(f"非法的课时学习状态: {status}") from e

        task = await self._get_owned_task(lesson_id, user_id)
        task = await self._repository.update_task_status(task, validated)
        await self.session.commit()
        return LessonInfoResponse.model_validate(task)

    async def _get_owned_task(self, lesson_id: int, user_id: int) -> LearningTask:
        task = await self._repository.get_task(lesson_id, user_id)
        if not task:
            raise NotFoundException("课时不存在")
        return task

    @staticmethod
    def _to_response(
        task: LearningTask, content: LessonContent
    ) -> LessonContentResponse:
        return LessonContentResponse(
            id=content.id,
            lesson_id=content.lesson_id,
            title=task.title,
            blocks=content.blocks,
            created_at=content.created_at,
            updated_at=content.updated_at,
        )
