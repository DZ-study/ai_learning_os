from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

NodeType = Literal["course", "note", "document"]

EntityType = Literal["goal_plan", "goal_item", "learning_task"]


class NodeCreate(BaseModel):
    type: NodeType
    title: str = Field(min_length=1, max_length=255)
    content: dict[str, Any] = Field(default_factory=dict)
    position: dict[str, Any] = Field(default_factory=lambda: {"x": 42, "y": 78})
    entity_type: EntityType | None = None
    entity_id: int | None = None


class NodePositionUpdate(BaseModel):
    position: dict[str, Any]


class NodeResponse(NodeCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    user_id: int
