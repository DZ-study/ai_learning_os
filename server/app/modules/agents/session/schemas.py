from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AgentSessionCreateData(BaseModel):
    user_id: int
    agent_type: str
    goal_id: int | None = None
    stage: str = "initial"
    context: dict = {}
    status: str = "pending"


class AgentSessionHistoryResponse(BaseModel):
    session_id: int
    stage: str
    status: str
    context: dict
    messages: list["AgentMessageResponse"] = Field(default_factory=list)
    messages_total: int = 0


class AgentMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    sequence: int
    role: str
    content: str
    message_type: str
    metadata: dict
    token_count: int | None = None
    created_at: datetime
