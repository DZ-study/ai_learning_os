from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class AgentResultStatus(StrEnum):
    COMPLETED = "completed"
    WAITING_USER = "waiting_user"
    CONTINUE = "continue"
    FAILED = "failed"


class AgentUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0


class AgentResult(BaseModel):
    status: AgentResultStatus

    output: dict[str, Any] = Field(default_factory=dict)

    message: str | None = None

    next_hint: str | None = None

    artifacts: list[dict[str, Any]] = Field(default_factory=list)

    usage: AgentUsage | None = None

    error_code: str | None = None

    error_message: str | None = None
