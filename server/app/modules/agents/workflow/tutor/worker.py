import json
import logging

from app.infrastructure.ai.prompts.prompt import (
    LESSON_CONTENT_SYSTEM,
    LESSON_CONTENT_USER,
)
from app.infrastructure.ai.service import LLMService
from app.modules.agents.contracts.context import GlobalAgentContext
from app.modules.agents.contracts.result import AgentResult, AgentResultStatus
from app.modules.lessons.schemas import (
    GeneratedLessonContent,
    GeneratedQuizQuestions,
)
from app.shared.exceptions import ServiceUnavailableException

from .schemas import TutorLessonContext, TutorQuestionContext

logger = logging.getLogger(__name__)


class TutorWorker:
    """Generate one Lesson's structured content without touching persistence."""

    def __init__(self, llm: LLMService, session_repository=None) -> None:
        self.llm = llm
        self.session_repository = session_repository

    async def execute(self, context: GlobalAgentContext) -> AgentResult:
        """Answer a knowledge question without entering goal planning."""
        session_id = self._session_id(context.session_id)
        execution_token = None
        if self.session_repository is not None and session_id is not None:
            execution_token = await self.session_repository.claim_execution(session_id)
            if execution_token is None:
                return AgentResult(
                    status=AgentResultStatus.FAILED,
                    error_code="SESSION_BUSY",
                    error_message="当前会话正在处理中，请稍后重试",
                )
            await self.session_repository.append_message(
                session_id, role="user", content=context.user_input or ""
            )
        try:
            response = await self.llm.chat(
                self._build_question(context),
                system_prompt=(
                    "你是一名专业学习导师。请直接回答用户当前的学习问题，"
                    "用清晰、准确、适合初学者理解的方式解释。"
                    "不要生成学习计划，不要询问用户创建 Goal，"
                    "不要输出 JSON 或 Markdown 代码块之外的控制信息。"
                ),
            )
        except Exception as exc:
            logger.exception("tutor question failed, session_id=%s", context.session_id)
            if execution_token is not None:
                await self.session_repository.finish_execution(
                    session_id, execution_token
                )
            return AgentResult(
                status=AgentResultStatus.FAILED,
                error_code="TUTOR_FAILED",
                error_message="导师回答失败，请稍后重试",
                message=str(exc),
            )

        if execution_token is not None:
            assistant_message = await self.session_repository.append_message(
                session_id,
                role="assistant",
                content=response.content,
                message_type="answer",
            )
            await self.session_repository.finish_execution(
                session_id,
                execution_token,
                stage="tutoring",
                status="active",
                last_message_id=assistant_message.id,
            )

        return AgentResult(
            status=AgentResultStatus.COMPLETED,
            message=response.content,
            output={
                "response_type": "tutor_answer",
                "stage": "tutoring",
                "session_id": self._session_id(context.session_id),
                "answer": response.content,
            },
        )

    async def stream_question(self, context: TutorQuestionContext):
        """Stream a stateless Lesson Tutor answer without touching sessions."""
        user_prompt = json.dumps(
            {
                "question": context.user_message,
                "goal": context.goal,
                "lesson": context.lesson,
                "current_block": context.current_block,
                "block_content": context.block_content,
                "recent_messages": [
                    message.model_dump() for message in context.recent_messages
                ],
            },
            ensure_ascii=False,
        )
        system_prompt = (
            "你是一名专业学习导师。请严格结合用户当前的 Goal、Lesson 和当前 Block 回答问题。"
            "当前课程内容优先于用户历史消息。回答要清晰、准确、适合初学者理解。"
            "不要生成学习计划，不要修改课程内容，不要输出 JSON 或控制信息。"
        )
        async for chunk in self.llm.chat_stream(
            user_prompt,
            system_prompt=system_prompt,
        ):
            yield chunk

    @staticmethod
    def _build_question(context: GlobalAgentContext) -> str:
        goal = context.environment.get("goal") or {}
        return json.dumps(
            {
                "question": context.user_input or "",
                "goal": goal,
                "recent_conversation": context.conversation[-8:],
            },
            ensure_ascii=False,
        )

    @staticmethod
    def _session_id(value: str) -> int | None:
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

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
        """Ask the model for missing quiz items; persistence stays in LessonService."""
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
