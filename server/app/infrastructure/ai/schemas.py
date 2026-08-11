"""LLM 层通用数据结构。

定义请求/响应 schema，与具体 Provider 无关，
确保切换模型时业务层代码无需任何修改。
"""

from typing import Literal

from pydantic import BaseModel, Field


# ── 消息 ──


class Message(BaseModel):
    """单条对话消息。"""

    role: Literal["system", "user", "assistant"] = Field(
        ..., description="消息角色"
    )
    content: str = Field(..., description="消息内容")


# ── 请求 ──


class LLMRequest(BaseModel):
    """LLM 统一请求格式。

    业务层只构造此对象，不关心底层是哪个 Provider。
    """

    messages: list[Message] = Field(..., description="消息列表")
    model: str | None = Field(default=None, description="模型名称，None 则使用配置默认值")
    max_tokens: int | None = Field(default=None, description="最大输出 token 数")
    temperature: float | None = Field(default=None, description="温度参数 0-2")


# ── 响应 ──


class LLMUsage(BaseModel):
    """Token 用量统计。"""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class LLMResponse(BaseModel):
    """LLM 统一响应格式。

    所有 Provider 的返回值都会转换为此结构。
    """

    content: str = Field(..., description="生成的文本内容")
    model: str = Field(default="", description="实际使用的模型名称")
    usage: LLMUsage | None = Field(default=None, description="Token 用量")
    finish_reason: str | None = Field(
        default=None, description="结束原因: stop | length | content_filter"
    )
