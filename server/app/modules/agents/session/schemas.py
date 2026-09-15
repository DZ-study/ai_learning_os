from pydantic import BaseModel


class AgentSessionCreateData(BaseModel):
    user_id: int
    agent_type: str
    goal_id: int | None = None
    stage: str = "initial"
    context: dict = {}
    status: str = "pending"
