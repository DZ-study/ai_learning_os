"""LLM 业务服务。

对 Business Layer 暴露业务语义化的接口，
依赖 LLMClient 而非具体 Provider，确保模型可替换。
"""

import logging
from typing import AsyncIterator, TypeVar

from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel

from app.infrastructure.ai.schemas import LLMResponse

StructuredModel = TypeVar("StructuredModel", bound=BaseModel)
logger = logging.getLogger(__name__)


class LLMService:
    """LLM 业务服务封装。
    封装 prompt 组装、结果解析、重试等业务逻辑。
    Business Layer 只依赖此 Service，不直接调 LLMClient。
    """

    def __init__(self, model: BaseChatModel) -> None:
        self.model = model

    # ── 通用调用 ────────────────────────────────
    async def chat(
        self,
        user_message: str,
        *,
        system_prompt: str | None = None,
        temperature: float | None = None,
    ) -> LLMResponse:
        """通用对话。"""
        messages = []

        if system_prompt:
            messages.append(("system", system_prompt))

        messages.append(("human", user_message))

        model = self.model
        if temperature is not None:
            model = model.bind(temperature=temperature)

        response = await model.ainvoke(messages)

        content = response.content
        if not isinstance(content, str):
            content = str(content)

        return LLMResponse(
            content=content, model=response.response_metadata.get("model_name", "")
        )

    # —— 流式调用 ———————————————————————————————
    async def chat_stream(
        self,
        user_message: str,
        *,
        system_prompt: str | None = None,
        temperature: float | None = None,
    ) -> AsyncIterator[str]:
        messages = []

        if system_prompt:
            messages.append(("system", system_prompt))

        messages.append(("human", user_message))

        model = self.model
        if temperature is not None:
            model = model.bind(temperature=temperature)

        async for chunk in model.astream(messages):
            if isinstance(chunk.content, str):
                yield chunk.content

    async def structured(
        self,
        user_message: str,
        *,
        output_schema: type[StructuredModel],
        system_prompt: str | None = None,
    ) -> StructuredModel:
        """Invoke the provider's structured-output interface and validate it."""
        messages = []
        if system_prompt:
            messages.append(("system", system_prompt))
        messages.append(("human", user_message))

        # Lesson content is requested as JSON by the prompt.  Explicitly use
        # JSON mode instead of relying on the provider's default function
        # calling mode, which can produce ``None`` when no tool call is
        # returned even though the model generated a structured response.
        structured_model = self.model.with_structured_output(
            output_schema,
            method="json_mode",
        )
        response = await structured_model.ainvoke(messages)

        # Keep this temporary diagnostic deliberately limited to the parsed
        # response, not the prompt or conversation context.
        logger.debug(
            "LLM structured response: schema=%s type=%s repr=%s",
            output_schema.__name__,
            type(response).__name__,
            repr(response)[:500],
        )

        if response is None:
            raise ValueError(
                f"Structured output returned None for {output_schema.__name__}"
            )
        if isinstance(response, output_schema):
            return response
        return output_schema.model_validate(response)

    # # ── 学习目标解析 ────────────────────────────

    # async def parse_goal(self, user_input: str) -> LLMResponse:
    #     """将用户自然语言描述的学习目标解析为结构化描述。"""
    #     from server.app.infrastructure.ai.prompts.prompt import GOAL_PARSE_SYSTEM

    #     messages = [
    #         Message(role="system", content=GOAL_PARSE_SYSTEM),
    #         Message(role="user", content=user_input),
    #     ]
    #     return await self._llm.generate(LLMRequest(messages=messages, temperature=0.3))

    # # ── 学习计划生成 ────────────────────────────

    # async def generate_plan(self, goal_description: str) -> LLMResponse:
    #     """根据学习目标生成阶段性学习计划。"""
    #     from server.app.infrastructure.ai.prompts.prompt import PLAN_GENERATE_SYSTEM

    #     messages = [
    #         Message(role="system", content=PLAN_GENERATE_SYSTEM),
    #         Message(role="user", content=goal_description),
    #     ]
    #     return await self._llm.generate(LLMRequest(messages=messages, temperature=0.5))
