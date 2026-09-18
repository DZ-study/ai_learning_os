from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

LessonStatus = Literal["pending", "in_progress", "completed"]


class LessonBlock(BaseModel):
    """可扩展内容块，type 不限定（text/image/code/video/quiz/exercise 等）。"""

    type: str
    data: dict[str, Any] = Field(default_factory=dict)


class LessonInfoResponse(BaseModel):
    """课时（LearningTask）元信息。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    plan_item_id: int | None
    task_date: date
    title: str
    description: str | None
    estimated_minutes: int
    status: LessonStatus
    created_at: datetime
    updated_at: datetime


class GeneratedLessonContent(BaseModel):
    """LLM 结构化输出的校验模型。"""

    title: str
    blocks: list[LessonBlock]


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
