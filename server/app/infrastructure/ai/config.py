"""AI 模块专用配置。

所有 LLM 相关配置集中在 .env 中，通过 pydantic-settings 读取。
切换模型只需修改 LLM_PROVIDER 和对应的 API_KEY 环境变量。
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class AISettings(BaseSettings):
    """LLM 配置。

    切换模型示例:
        # .env 文件
        LLM_PROVIDER=deepseek
        LLM_API_KEY=sk-xxx
        LLM_MODEL=deepseek-chat
    """

    # ── Provider 选择 ──
    # LLM_PROVIDER: str = "openai"  # openai | deepseek | claude
    # LLM_MODEL: str = "gpt-4o"
    # LLM_API_KEY: str = ""
    LLM_PROVIDER = "deepseek"
    LLM_API_KEY = ""
    LLM_MODEL = "deepseek-chat"

    # ── OpenAI / OpenAI-compatible ──
    LLM_BASE_URL: str | None = None  # DeepSeek 等兼容 API 的 base_url

    # ── Claude 专用 ──
    LLM_CLAUDE_API_KEY: str = ""

    # ── 生成参数 ──
    LLM_MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.7
    LLM_TIMEOUT: int = 60  # 请求超时（秒）

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_ai_settings() -> AISettings:
    return AISettings()
