from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

LessonStatus = Literal["pending", "in_progress", "completed"]

LessonBlockType = Literal[
    "explanation",
    "example",
    "code",
    "question",
    "quiz",
    "summary",
]


class GeneratedLessonBlock(BaseModel):
    """LLM structured output block; array position defines teaching order."""

    type: LessonBlockType
    title: str
    content: dict[str, Any] = Field(default_factory=dict)


class LessonBlock(GeneratedLessonBlock):
    """Persisted lesson block with an application-assigned order."""

    order: int = Field(ge=1)


class LessonInfoResponse(BaseModel):
    """课时（LearningTask）元信息。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    plan_item_id: int | None
    completed_at: datetime | None
    title: str
    description: str | None
    estimated_minutes: int
    status: LessonStatus
    created_at: datetime
    updated_at: datetime


class GeneratedLessonContent(BaseModel):
    """LLM 结构化输出的校验模型。"""

    title: str
    blocks: list[GeneratedLessonBlock]


class LessonContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    title: str
    blocks: list[LessonBlock]
    created_at: datetime
    updated_at: datetime


class LessonContentNotGenerated(BaseModel):
    """内容尚未生成时的正常业务返回。"""

    status: Literal["not_generated"] = "not_generated"
    content: None = None
