from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


NodeType = Literal["course", "note", "document"]


class NodeCreate(BaseModel):
    type: NodeType
    title: str = Field(min_length=1, max_length=255)
    content: dict[str, Any] = Field(default_factory=dict)
    position: dict[str, Any] = Field(default_factory=lambda: {"x": 42, "y": 78})


class NodeResponse(NodeCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    user_id: int
