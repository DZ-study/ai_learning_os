from typing import Any

from pydantic import BaseModel


class AgentState(BaseModel):
    session_id: int

    goal_id: int

    goal_title: str

    collected_info: dict[str, Any] = {}

    missing_info: list[str] = []

    messages: list[dict] = []

    phase: str = "analyze"
