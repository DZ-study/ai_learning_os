from typing import Any, Literal

from pydantic import BaseModel, Field

from app.modules.lessons.schemas import GeneratedLessonContent


class TutorLessonContext(BaseModel):
    goal: dict[str, Any]
    plan: dict[str, Any]
    chapter: dict[str, Any]
    lesson: dict[str, Any]
    learning_context: dict[str, Any] = Field(default_factory=dict)


class TutorMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=5000)


class TutorQuestionContext(BaseModel):
    goal: dict[str, Any]
    lesson: dict[str, Any]
    current_block: dict[str, Any] | None = None
    block_content: Any = None
    recent_messages: list[TutorMessage] = Field(max_length=20)
    user_message: str = Field(min_length=1, max_length=5000)


class TutorGenerationResult(BaseModel):
    content: GeneratedLessonContent
