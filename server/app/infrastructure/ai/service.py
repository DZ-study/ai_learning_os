"""LLM 业务服务。

对 Business Layer 暴露业务语义化的接口，
依赖 LLMClient 而非具体 Provider，确保模型可替换。
"""

from typing import AsyncIterator

from langchain_core.language_models import BaseChatModel

from app.infrastructure.ai.schemas import LLMResponse


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
