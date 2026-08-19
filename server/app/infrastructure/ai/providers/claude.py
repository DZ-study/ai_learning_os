"""Claude Provider。

基于 anthropic SDK 的 AsyncAnthropic 实现。
支持 Claude Opus、Sonnet、Haiku 等 Anthropic 模型。
"""

from collections.abc import AsyncIterator

from app.infrastructure.ai.config import AISettings, get_ai_settings
from app.infrastructure.ai.schemas import LLMRequest, LLMResponse, LLMUsage
from server.app.infrastructure.agent.core.exceptions import LLMApiError, LLMTimeoutError
from server.app.infrastructure.ai.providers.base import BaseLLMProvider


class ClaudeProvider(BaseLLMProvider):
    """Claude 模型 Provider。

    通过 anthropic SDK 调用 Anthropic Messages API。
    """

    def __init__(self, settings: AISettings | None = None) -> None:
        self._settings = settings or get_ai_settings()
        # 延迟导入，避免未安装 anthropic 时影响其他 Provider 的加载
        from anthropic import AsyncAnthropic

        api_key = self._settings.LLM_CLAUDE_API_KEY or self._settings.LLM_API_KEY
        self._client = AsyncAnthropic(
            api_key=api_key,
            timeout=self._settings.LLM_TIMEOUT,
        )

    # ── 消息格式转换 ─────────────────────────────

    def _build_system_prompt(self, request: LLMRequest) -> str | None:
        """提取 system 消息作为 Claude 的系统提示。"""
        for msg in request.messages:
            if msg.role == "system":
                return msg.content
        return None

    def _build_messages(self, request: LLMRequest) -> list[dict]:
        """将统一 Message 转为 Claude 消息格式（仅 user/assistant）。"""
        return [
            {"role": m.role, "content": m.content}
            for m in request.messages
            if m.role in ("user", "assistant")
        ]

    # ── 非流式生成 ──────────────────────────────

    async def generate(self, request: LLMRequest) -> LLMResponse:
        try:
            kwargs: dict = dict(
                model=request.model or self._settings.LLM_MODEL,
                messages=self._build_messages(request),
                max_tokens=request.max_tokens or self._settings.LLM_MAX_TOKENS,
                temperature=request.temperature or self._settings.LLM_TEMPERATURE,
            )
            system = self._build_system_prompt(request)
            if system:
                kwargs["system"] = system

            response = await self._client.messages.create(**kwargs)
        except Exception as exc:
            self._raise_error(exc)

        usage = None
        if response.usage:
            usage = LLMUsage(
                prompt_tokens=response.usage.input_tokens or 0,
                completion_tokens=response.usage.output_tokens,
                total_tokens=(
                    (response.usage.input_tokens or 0) + response.usage.output_tokens
                ),
            )

        content = ""
        for block in response.content:
            if block.type == "text":
                content += block.text

        return LLMResponse(
            content=content,
            model=response.model,
            usage=usage,
            finish_reason=response.stop_reason,
        )

    # ── 流式生成 ────────────────────────────────

    async def generate_stream(self, request: LLMRequest) -> AsyncIterator[str]:
        try:
            kwargs = dict(
                model=request.model or self._settings.LLM_MODEL,
                messages=self._build_messages(request),
                max_tokens=request.max_tokens or self._settings.LLM_MAX_TOKENS,
                temperature=request.temperature or self._settings.LLM_TEMPERATURE,
            )
            system = self._build_system_prompt(request)
            if system:
                kwargs["system"] = system

            if "max_tokens" in kwargs and isinstance(kwargs["max_tokens"], float):
                kwargs["max_tokens"] = int(kwargs["max_tokens"])

            async with self._client.messages.stream(**kwargs) as stream:  # type: ignore
                async for text in stream.text_stream:
                    yield text
        except Exception as exc:
            self._raise_error(exc)

    # ── 健康检查 ────────────────────────────────

    async def health_check(self) -> bool:
        try:
            # Claude 没有简单的 list models 端点，
            # 发一条极短消息验证 API key 有效
            response = await self._client.messages.create(
                model=self._settings.LLM_MODEL,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1,
            )
            return response is not None
        except Exception:
            return False

    # ── 错误映射 ────────────────────────────────

    @staticmethod
    def _raise_error(exc: Exception) -> None:
        msg = str(exc)
        if "timeout" in msg.lower() or "timed out" in msg.lower():
            raise LLMTimeoutError(msg) from exc
        if "rate" in msg.lower():
            from server.app.infrastructure.agent.core.exceptions import (
                LLMRateLimitError,
            )

            raise LLMRateLimitError(msg) from exc
        raise LLMApiError(
            f"Claude API 调用失败: {msg}", data={"original_error": msg}
        ) from exc
