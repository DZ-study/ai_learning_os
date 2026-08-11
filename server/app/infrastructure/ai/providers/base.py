"""LLM Provider 抽象基类。

所有 Provider 必须实现此接口，确保业务层无需感知具体模型厂商。
新增厂商只需: 继承 BaseLLMProvider → 实现三个抽象方法 → 注册到 client.py 工厂函数。
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from app.infrastructure.ai.schemas import LLMRequest, LLMResponse


class BaseLLMProvider(ABC):
    """LLM Provider 抽象接口。

    所有模型厂商的 Provider 必须实现以下方法:
    - generate:        非流式生成，返回完整响应
    - generate_stream: 流式生成，逐块返回文本增量
    - health_check:    验证 Provider 可用性
    """

    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """非流式生成，返回完整响应。"""
        ...

    @abstractmethod
    async def generate_stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """流式生成，每次 yield 一段增量文本。"""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """检查 Provider 是否可用（API key 有效、网络可达）。"""
        ...
