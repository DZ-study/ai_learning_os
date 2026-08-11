"""AI 模块 —— 大模型统一接入层。

位于 infrastructure 层，与 email/redis 同级，作为外部服务的基础设施封装。

架构层次:
    Business Layer (modules/)
         ↓
    LLMService (service.py)         ← 业务语义封装
         ↓
    LLMClient (client.py)           ← 统一门面 + 工厂
         ↓
    BaseLLMProvider (providers/base.py)  ← 抽象接口
         ↓
    OpenAIProvider / DeepSeekProvider / ClaudeProvider

使用示例:
    from app.infrastructure.ai import create_llm_client, LLMService
    from app.infrastructure.ai.schemas import LLMRequest, Message

    llm = create_llm_client()
    response = await llm.generate(LLMRequest(
        messages=[Message(role="user", content="你好")],
    ))
"""

from app.infrastructure.ai.client import LLMClient, create_llm_client
from app.infrastructure.ai.schemas import LLMRequest, LLMResponse, LLMUsage, Message
from app.infrastructure.ai.service import LLMService

__all__ = [
    "LLMClient",
    "LLMService",
    "create_llm_client",
    "LLMRequest",
    "LLMResponse",
    "LLMUsage",
    "Message",
]
