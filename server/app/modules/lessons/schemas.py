from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

LessonStatus = Literal["pending", "in_progress", "completed"]

# 一节完整课程内容必须包含的核心内容块
REQUIRED_BLOCK_TYPES = frozenset({"explanation", "example", "quiz", "summary"})


class LessonBlock(BaseModel):
    """可扩展内容块，type 不限定（explanation/example/quiz/summary/text/code 等）。"""

    type: str
    data: dict[str, Any] = Field(default_factory=dict)


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
    blocks: list[LessonBlock]

    @model_validator(mode="after")
    def _require_core_blocks(self) -> "GeneratedLessonContent":
        missing = REQUIRED_BLOCK_TYPES - {block.type for block in self.blocks}
        if missing:
            raise ValueError(f"缺少必需内容块: {', '.join(sorted(missing))}")
        return self


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
