from typing import Any

from pydantic import BaseModel, Field

from app.modules.lessons.schemas import GeneratedLessonContent


class TutorLessonContext(BaseModel):
    goal: dict[str, Any]
    plan: dict[str, Any]
    chapter: dict[str, Any]
    lesson: dict[str, Any]
    learning_context: dict[str, Any] = Field(default_factory=dict)


class TutorGenerationResult(BaseModel):
    content: GeneratedLessonContent
