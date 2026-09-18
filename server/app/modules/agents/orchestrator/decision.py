from typing import Any

from pydantic import BaseModel, Field

from .actions import OrchestratorAction


class OrchestratorDecision(BaseModel):
    action: OrchestratorAction

    target_agent: str | None = None

    reason: str = ""

    parameters: dict[str, Any] = Field(default_factory=dict)

    requires_user_input: bool = False

    terminate: bool = False
