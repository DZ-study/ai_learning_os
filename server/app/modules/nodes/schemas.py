from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

NodeType = Literal["course", "note", "document"]

EntityType = Literal["goal_plan", "goal_item", "learning_task"]
CoursePlanStatus = Literal["generating", "ready", "error"]
CourseLessonStatus = Literal["locked", "available", "completed"]


class NodeCreate(BaseModel):
    type: NodeType
    title: str = Field(min_length=1, max_length=255)
    content: dict[str, Any] = Field(default_factory=dict)
    position: dict[str, Any] = Field(default_factory=lambda: {"x": 42, "y": 78})
    entity_type: EntityType | None = None
    entity_id: int | None = None


class NodePositionUpdate(BaseModel):
    position: dict[str, Any]


class CourseLessonResponse(BaseModel):
    id: int
    title: str
    estimated_minutes: int | None = Field(
        default=None, serialization_alias="estimatedMinutes"
    )
    status: CourseLessonStatus


class CourseChapterResponse(BaseModel):
    id: str
    title: str
    lessons: list[CourseLessonResponse]


class CoursePlanResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    chapters: list[CourseChapterResponse]
    status: CoursePlanStatus


class NodeResponse(NodeCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    user_id: int
    course_plan: CoursePlanResponse | None = None
