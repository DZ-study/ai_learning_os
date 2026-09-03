from typing import Literal

from pydantic import BaseModel, Field


class AgentStartResponse(BaseModel):
    session_id: int
    stage: Literal[
        "collecting_info",
        "awaiting_plan_confirmation",
        "awaiting_daily_time",
        "assigned_today",
    ]
    message: str
    question: str | None = None
    plan: dict | None = None
    tasks: list[dict] = Field(default_factory=list)


class AgentReplyRequest(BaseModel):
    # 首次请求用于创建/恢复会话，因此 session_id 可以为空。
    session_id: int | None = None
    # 空消息只用于启动 SSE 并返回首个问题；后续消息仍由业务层处理。
    message: str = Field(default="", max_length=5000)


class AgentConfirmRequest(BaseModel):
    session_id: int
