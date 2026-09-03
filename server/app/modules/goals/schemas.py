from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class GoalBase(BaseModel):
    """Fields shared by goal creation and updates."""

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    title: str = Field(min_length=2, max_length=255, description="目标标题")
    description: str = Field(min_length=10, description="目标详细描述")
    duration: int = Field(
        validation_alias="duration",
        serialization_alias="duration",
        description="期望完成时长(天)",
    )
    available_time: str | None = Field(
        default=None,
        max_length=255,
        validation_alias="availableTime",
        serialization_alias="availableTime",
        description="每日可投入时间(h)",
    )
    priority: Literal["low", "medium", "high"] | None = Field(
        default=None,
        description="优先级",
    )
    preferences: str | None = Field(default=None, description="用户偏好")
    constraints: str | None = Field(default=None, description="限制条件")


class GoalCreate(GoalBase):
    """Create-goal request, matching web/src/types/goal.ts."""


class GoalUpdate(BaseModel):
    """All editable goal fields are optional when updating a goal."""

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=10)
    duration: int = Field(
        validation_alias="duration",
        serialization_alias="duration",
    )
    available_time: str | None = Field(
        default=None,
        max_length=255,
        validation_alias="availableTime",
        serialization_alias="availableTime",
    )
    priority: Literal["low", "medium", "high"] | None = None
    preferences: str | None = None
    constraints: str | None = None
    status: Literal["draft", "active", "paused", "completed", "archived"] | None = None


class GoalPlanResponse(BaseModel):
    id: int
    goal_id: int
    user_id: int
    version: int
    content: dict[str, Any]

    status: str
    confirmed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class GoalResponse(BaseModel):
    """Goal data returned to the web client."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    user_id: int
    title: str
    description: str | None
    duration: int = Field(serialization_alias="duration")
    available_time: str | None = Field(serialization_alias="availableTime")
    priority: Literal["low", "medium", "high"] | None
    preferences: str | None
    constraints: str | None
    plan: GoalPlanResponse | None = None
    status: Literal["draft", "active", "paused", "completed", "archived"]
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class GoalParseRequest(BaseModel):
    messages: str = Field(min_length=1)


class GoalParseResponse(BaseModel):
    content: str
