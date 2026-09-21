import json
import logging

from app.infrastructure.ai.prompts.prompt import (
    LESSON_CONTENT_SYSTEM,
    LESSON_CONTENT_USER,
)
from app.infrastructure.ai.service import LLMService
from app.modules.lessons.schemas import GeneratedLessonContent
from app.shared.exceptions import ServiceUnavailableException

from .schemas import TutorLessonContext

logger = logging.getLogger(__name__)


class TutorWorker:
    """Generate one Lesson's structured content without touching persistence."""

    def __init__(self, llm: LLMService) -> None:
        self.llm = llm

    async def generate(self, context: TutorLessonContext) -> GeneratedLessonContent:
        user_prompt = LESSON_CONTENT_USER.replace(
            "{{context}}",
            json.dumps(context.model_dump(mode="json"), ensure_ascii=False),
        )

        try:
            return await self.llm.structured(
                user_prompt,
                output_schema=GeneratedLessonContent,
                system_prompt=LESSON_CONTENT_SYSTEM,
            )
        except Exception as exc:
            logger.exception(
                "tutor lesson generation failed, lesson_id=%s, error=%s",
                context.lesson.get("id"),
                exc,
            )
            raise ServiceUnavailableException("学习内容生成失败，请稍后再试") from exc
