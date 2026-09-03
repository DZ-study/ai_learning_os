from functools import lru_cache

from langchain_deepseek import ChatDeepSeek
from pydantic import SecretStr

from app.infrastructure.ai.config import get_ai_settings


@lru_cache
def get_chat_model() -> ChatDeepSeek:
    settings = get_ai_settings()

    return ChatDeepSeek(
        model=settings.LLM_MODEL or "deepseek-chat",
        api_key=SecretStr(settings.LLM_API_KEY),
        base_url=settings.LLM_BASE_URL or "https://api.deepseek.com",
        temperature=settings.LLM_TEMPERATURE,
        max_tokens=settings.LLM_MAX_TOKENS,
        timeout=settings.LLM_TIMEOUT,
    )
