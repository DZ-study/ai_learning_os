"""DeepSeek Provider。

DeepSeek API 是 OpenAI-compatible 的，因此复用 openai SDK，
仅修改 base_url 和 api_key 指向 DeepSeek 服务。
"""

from collections.abc import AsyncIterator
from typing import cast

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam

from app.modules.goals.agent.exceptions import LLMApiError, LLMTimeoutError
from app.infrastructure.ai.config import AISettings, get_ai_settings
from app.infrastructure.ai.providers.base import BaseLLMProvider
from app.infrastructure.ai.schemas import LLMRequest, LLMResponse, LLMUsage

DEEPSEEK_BASE_URL = "https://api.deepseek.com"


class DeepSeekProvider(BaseLLMProvider):
    """DeepSeek 模型 Provider。

    基于 OpenAI-compatible API，使用 openai SDK 调用。
    默认 base_url 指向 DeepSeek 官方 API。
    """

    def __init__(self, settings: AISettings | None = None) -> None:
        self._settings = settings or get_ai_settings()
        self._client = AsyncOpenAI(
            api_key=self._settings.LLM_API_KEY,
            base_url=self._settings.LLM_BASE_URL or DEEPSEEK_BASE_URL,
            timeout=self._settings.LLM_TIMEOUT,
        )

    # ── 非流式生成 ──────────────────────────────

    async def generate(self, request: LLMRequest) -> LLMResponse:
        try:
            messages = [m.model_dump() for m in request.messages]
            response = await self._client.chat.completions.create(
                model=request.model or self._settings.LLM_MODEL,
                # cast 类型检查
                messages=cast(list[ChatCompletionMessageParam], messages),
                max_tokens=request.max_tokens or self._settings.LLM_MAX_TOKENS,
                temperature=request.temperature or self._settings.LLM_TEMPERATURE,
                stream=False,
            )
        except Exception as exc:
            self._raise_error(exc)

        choice = response.choices[0]
        usage = None
        if response.usage:
            usage = LLMUsage(
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=response.usage.total_tokens,
            )

        return LLMResponse(
            content=choice.message.content or "",
            model=response.model,
            usage=usage,
            finish_reason=choice.finish_reason,
        )

    # ── 流式生成 ────────────────────────────────

    async def generate_stream(self, request: LLMRequest) -> AsyncIterator[str]:
        try:
            messages = [m.model_dump() for m in request.messages]
            stream = await self._client.chat.completions.create(
                model=request.model or self._settings.LLM_MODEL,
                messages=cast(list[ChatCompletionMessageParam], messages),
                max_tokens=request.max_tokens or self._settings.LLM_MAX_TOKENS,
                temperature=request.temperature or self._settings.LLM_TEMPERATURE,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    yield delta.content
        except Exception as exc:
            self._raise_error(exc)

    # ── 健康检查 ────────────────────────────────

    async def health_check(self) -> bool:
        try:
            await self._client.models.list()
            return True
        except Exception:
            return False

    # ── 错误映射 ────────────────────────────────

    @staticmethod
    def _raise_error(exc: Exception) -> None:
        msg = str(exc)
        if "timeout" in msg.lower() or "timed out" in msg.lower():
            raise LLMTimeoutError(msg) from exc
        raise LLMApiError(
            f"DeepSeek API 调用失败: {msg}", data={"original_error": msg}
        ) from exc
