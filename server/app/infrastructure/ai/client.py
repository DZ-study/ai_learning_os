"""统一 LLM 调用入口。

提供 LLMClient 门面 + create_llm_client() 工厂函数。
业务层只依赖此模块，切换模型只需修改环境变量。
"""

from collections.abc import AsyncIterator
from functools import lru_cache

from app.modules.goals.agent.exceptions import LLMConfigError
from app.infrastructure.ai.config import AISettings, get_ai_settings
from app.infrastructure.ai.providers.base import BaseLLMProvider
from app.infrastructure.ai.schemas import LLMRequest, LLMResponse

# Provider 注册表 —— 新增厂商只需在此加一行
_PROVIDER_REGISTRY: dict[str, type[BaseLLMProvider]] = {}


def _register():
    """延迟注册 Provider，避免未安装的 SDK 导致导入失败。"""
    try:
        from app.infrastructure.ai.providers.openai import OpenAIProvider

        _PROVIDER_REGISTRY["openai"] = OpenAIProvider
    except ImportError:
        pass

    try:
        from app.infrastructure.ai.providers.deepseek import DeepSeekProvider

        _PROVIDER_REGISTRY["deepseek"] = DeepSeekProvider
    except ImportError:
        pass

    try:
        from app.infrastructure.ai.providers.claude import ClaudeProvider

        _PROVIDER_REGISTRY["claude"] = ClaudeProvider
    except ImportError:
        pass


class LLMClient:
    """LLM 统一调用门面。

    对业务层暴露统一的 generate / generate_stream 方法，
    内部委托给具体的 Provider 实例。
    """

    def __init__(self, provider: BaseLLMProvider) -> None:
        self._provider = provider

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """非流式生成。"""
        return await self._provider.generate(request)

    async def generate_stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """流式生成。"""
        async for chunk in self._provider.generate_stream(request):  # type: ignore
            yield chunk

    async def health_check(self) -> bool:
        """检查当前 Provider 是否可用。"""
        return await self._provider.health_check()


@lru_cache
def create_llm_client(settings: AISettings | None = None) -> LLMClient:
    """工厂函数：根据配置创建 LLMClient 实例。

    结果被 lru_cache 缓存，确保整个应用生命周期内只创建一次。

    切换模型: 修改 .env 中 LLM_PROVIDER 的值即可，业务代码零改动。

    Raises:
        LLMConfigError: Provider 不支持或 SDK 未安装
    """
    if not _PROVIDER_REGISTRY:
        _register()

    ai_settings = settings or get_ai_settings()
    provider_name = ai_settings.LLM_PROVIDER.lower()

    provider_cls = _PROVIDER_REGISTRY.get(provider_name)
    if provider_cls is None:
        available = ", ".join(_PROVIDER_REGISTRY.keys()) or "(无)"
        raise LLMConfigError(
            f"不支持的 LLM Provider: {provider_name}，"
            f"可用选项: {available}。请检查 LLM_PROVIDER 配置和对应 SDK 是否已安装。"
        )

    return LLMClient(provider_cls())
