from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

LessonStatus = Literal["not_started", "in_progress", "completed"]

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

    block_id: str = Field(min_length=1, max_length=64)
    order: int = Field(ge=1)
    required: bool = True


class LessonInfoResponse(BaseModel):
    """课时（LearningTask）元信息。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    plan_item_id: int | None
    started_at: datetime | None
    completed_at: datetime | None
    last_accessed_at: datetime | None
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


class GeneratedQuizQuestion(BaseModel):
    """A quiz item returned when the lesson needs more test questions."""

    question: str
    options: list[str] = Field(min_length=2)
    answer: str

    @field_validator("answer")
    @classmethod
    def answer_must_be_an_option(cls, value: str, info):
        options = info.data.get("options", [])
        if value not in options:
            raise ValueError("quiz answer must be one of the options")
        return value


class GeneratedQuizQuestions(BaseModel):
    questions: list[GeneratedQuizQuestion] = Field(default_factory=list)


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


class LessonProgressResponse(BaseModel):
    lesson_id: int
    status: LessonStatus
    started_at: datetime | None
    completed_at: datetime | None
    last_accessed_at: datetime | None
    total_required_blocks: int
    completed_required_blocks: int
    progress_percent: int
    completed_block_ids: list[str]
