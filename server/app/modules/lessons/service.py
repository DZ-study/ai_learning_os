"""
课时内容服务 — 查询或调用 LLM 生成课时的结构化学习内容。
"""

from pydantic import TypeAdapter, ValidationError

from app.infrastructure.ai.parser import extract_json
from app.infrastructure.ai.prompts.prompt import (
    LESSON_CONTENT_SYSTEM,
    LESSON_CONTENT_USER,
)
from app.infrastructure.ai.service import LLMService
from app.modules.goals.models import LearningTask, LessonContent
from app.modules.lessons.repository import LessonRepository
from app.modules.lessons.schemas import (
    GeneratedLessonContent,
    LessonContentNotGenerated,
    LessonContentResponse,
    LessonInfoResponse,
    LessonStatus,
)
from app.shared.exceptions import (
    BadRequestException,
    NotFoundException,
    ServiceUnavailableException,
)

_status_adapter: TypeAdapter[LessonStatus] = TypeAdapter(LessonStatus)


class LessonService:
    def __init__(
        self, session, repository: LessonRepository, ai_service: LLMService
    ) -> None:
        self.session = session
        self._repository = repository
        self._ai_service = ai_service

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

        generated = await self._generate(task, goal, plan_item)

        content = await self._repository.create_content(
            lesson_id=task.id,
            blocks=[block.model_dump() for block in generated.blocks],
        )
        await self.session.commit()
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

    async def _generate(self, task, goal, plan_item) -> GeneratedLessonContent:
        user_prompt = (
            LESSON_CONTENT_USER.replace("{{course}}", goal.title if goal else "")
            .replace("{{chapter}}", plan_item.title if plan_item else "")
            .replace("{{objectives}}", plan_item.objective if plan_item else "")
            .replace("{{title}}", task.title)
            .replace("{{description}}", task.description or "")
        )

        # LLM 输出格式异常时重试一次
        for _ in range(2):
            try:
                response = await self._ai_service.chat(
                    user_prompt, system_prompt=LESSON_CONTENT_SYSTEM
                )
                return GeneratedLessonContent.model_validate(
                    extract_json(response.content)
                )
            except (ValueError, ValidationError):
                continue
            except Exception as e:
                raise ServiceUnavailableException("内容生成失败，请稍后再试") from e

        raise ServiceUnavailableException("内容生成失败，请稍后再试")

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
