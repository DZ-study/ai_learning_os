import json
import logging

from app.infrastructure.ai.prompts.prompt import (
    LESSON_CONTENT_SYSTEM,
    LESSON_CONTENT_USER,
)
from app.infrastructure.ai.service import LLMService
from app.modules.lessons.schemas import (
    GeneratedLessonContent,
    GeneratedQuizQuestions,
)
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

    async def generate_quiz_questions(
        self, context: TutorLessonContext, count: int
    ) -> GeneratedQuizQuestions:
        """Ask the model only for missing quiz items; persistence stays in LessonService."""
        user_prompt = (
            "请根据以下 Lesson 上下文补充测试题。只生成 exactly "
            f"{count} 道互不重复的选择题，返回 questions 数组；每道题包含 question、"
            "options、answer，且 answer 必须是 options 中的一项。\n\n"
            f"{json.dumps(context.model_dump(mode='json'), ensure_ascii=False)}"
        )
        system_prompt = (
            "你是一名专业导师，只返回合法 JSON，不要 Markdown 或额外说明。"
            "测试题必须严格围绕当前 Lesson，不要扩展到其他章节。"
        )
        try:
            return await self.llm.structured(
                user_prompt,
                output_schema=GeneratedQuizQuestions,
                system_prompt=system_prompt,
            )
        except Exception as exc:
            logger.exception(
                "tutor quiz supplementation failed, lesson_id=%s, error=%s",
                context.lesson.get("id"),
                exc,
            )
            raise ServiceUnavailableException("测试题生成失败，请稍后再试") from exc
