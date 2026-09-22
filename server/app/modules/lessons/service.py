"""
课时内容服务 — 查询或调用 LLM 生成课时的结构化学习内容。
"""

from uuid import uuid4

from pydantic import TypeAdapter, ValidationError
from sqlalchemy.exc import IntegrityError

from app.modules.agents.workflow.tutor.schemas import TutorLessonContext
from app.modules.agents.workflow.tutor.worker import TutorWorker
from app.modules.goals.models import LearningTask, LessonContent
from app.modules.lessons.repository import LessonRepository
from app.modules.lessons.schemas import (
    GeneratedLessonBlock,
    GeneratedLessonContent,
    LessonBlock,
    LessonContentNotGenerated,
    LessonContentResponse,
    LessonInfoResponse,
    LessonProgressResponse,
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
        self._validate_persisted_quiz_count(content)
        return self._to_response(task, content)

    async def generate_content(
        self, lesson_id: int, user_id: int
    ) -> LessonContentResponse:
        task = await self._get_owned_task(lesson_id, user_id)

        existing = await self._repository.get_content(lesson_id)
        if existing:
            self._validate_persisted_quiz_count(existing)
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

        generated = await self._ensure_minimum_quizzes(
            generated, task, goal, plan_item, plan, learning_context
        )

        # This is a service-level invariant. Never persist or return generated
        # lesson content that has fewer than the required ten quiz blocks.
        if self._quiz_count(generated) < 10:
            raise BadRequestException("生成的测试题不足10道，请稍后重试")

        try:
            content = await self._repository.create_content(
                lesson_id=task.id,
                blocks=[
                    LessonBlock(
                        **block.model_dump(),
                        block_id=str(uuid4()),
                        order=order,
                        required=True,
                    ).model_dump()
                    for order, block in enumerate(generated.blocks, start=1)
                ],
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            existing = await self._repository.get_content(lesson_id)
            if existing:
                self._validate_persisted_quiz_count(existing)
                return self._to_response(task, existing)
            raise
        return self._to_response(task, content)

    async def _ensure_minimum_quizzes(
        self,
        generated: GeneratedLessonContent,
        task,
        goal,
        plan_item,
        plan,
        learning_context,
    ) -> GeneratedLessonContent:
        """Enforce the product invariant at the service boundary, not only in prompts."""
        quiz_count = self._quiz_count(generated)
        if quiz_count >= 10:
            return generated

        context = TutorLessonContext(
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
            learning_context={"lesson_status": task.status, **learning_context},
        )
        missing = 10 - quiz_count
        for _ in range(3):
            supplement = await self._tutor_worker.generate_quiz_questions(context, missing)
            for question in supplement.questions[:missing]:
                generated.blocks.append(
                    GeneratedLessonBlock(
                        type="quiz",
                        title="测试题",
                        content=question.model_dump(),
                    )
                )
            quiz_count = self._quiz_count(generated)
            if quiz_count >= 10:
                return generated
            missing = 10 - quiz_count

        raise BadRequestException("生成的测试题不足10道，请稍后重试")

    @staticmethod
    def _quiz_count(generated: GeneratedLessonContent) -> int:
        """Count quiz blocks after both initial generation and supplementation."""
        return sum(1 for block in generated.blocks if block.type == "quiz")

    @staticmethod
    def _validate_persisted_quiz_count(content: LessonContent) -> None:
        """Keep the API invariant for content generated by older code as well."""
        quiz_count = sum(
            1
            for block in (content.blocks or [])
            if isinstance(block, dict) and block.get("type") == "quiz"
        )
        if quiz_count < 10:
            raise BadRequestException("课时内容中的测试题不足10道，请重新生成")

    async def get_lesson_info(self, lesson_id: int, user_id: int) -> LessonInfoResponse:
        task = await self._get_owned_task(lesson_id, user_id)
        return LessonInfoResponse.model_validate(task)

    async def start_lesson(
        self, lesson_id: int, user_id: int
    ) -> LessonProgressResponse:
        task = await self._get_owned_task(lesson_id, user_id)
        await self._repository.start_task(task)
        await self.session.commit()
        return await self._build_progress(task, user_id)

    async def get_progress(
        self, lesson_id: int, user_id: int
    ) -> LessonProgressResponse:
        task = await self._get_owned_task(lesson_id, user_id)
        return await self._build_progress(task, user_id)

    async def complete_block(
        self, lesson_id: int, user_id: int, block_id: str
    ) -> LessonProgressResponse:
        task = await self._get_owned_task(lesson_id, user_id)
        content = await self._repository.get_content(lesson_id)
        if not content:
            raise BadRequestException("课时内容尚未生成")

        block_ids = {
            block.get("block_id")
            for block in content.blocks
            if isinstance(block, dict) and block.get("block_id")
        }
        if block_id not in block_ids:
            raise NotFoundException("学习内容块不存在")

        await self._repository.start_task(task)
        await self._repository.complete_block(lesson_id, user_id, block_id)
        await self.session.commit()
        return await self._build_progress(task, user_id, content)

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

    async def _build_progress(
        self,
        task: LearningTask,
        user_id: int,
        content: LessonContent | None = None,
    ) -> LessonProgressResponse:
        content = content or await self._repository.get_content(task.id)
        required_block_ids = {
            block.get("block_id")
            for block in (content.blocks if content else [])
            if isinstance(block, dict)
            and block.get("block_id")
            and block.get("required", True)
        }
        rows = await self._repository.get_block_progress(task.id, user_id)
        completed_block_ids = sorted(
            {
                row.block_id
                for row in rows
                if row.status == "completed"
                and (
                    not content
                    or any(
                        isinstance(block, dict)
                        and block.get("block_id") == row.block_id
                        for block in content.blocks
                    )
                )
            }
        )
        completed_required = len(required_block_ids.intersection(completed_block_ids))
        total_required = len(required_block_ids)
        progress_percent = (
            round(completed_required * 100 / total_required)
            if total_required
            else 0
        )
        return LessonProgressResponse(
            lesson_id=task.id,
            status=task.status,
            started_at=task.started_at,
            completed_at=task.completed_at,
            last_accessed_at=task.last_accessed_at,
            total_required_blocks=total_required,
            completed_required_blocks=completed_required,
            progress_percent=progress_percent,
            completed_block_ids=completed_block_ids,
        )

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
