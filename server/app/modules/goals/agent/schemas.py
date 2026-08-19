from typing import Literal

from pydantic import BaseModel, Field


class AgentStartResponse(BaseModel):
    session_id: str
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
    session_id: str
    message: str = Field(min_length=1, max_length=5000)
