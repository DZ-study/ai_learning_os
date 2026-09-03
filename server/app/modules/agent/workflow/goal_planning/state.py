from typing import Any, TypedDict

from pydantic import BaseModel, Field


class GoalPlanState(TypedDict, total=False):
    goal: dict[str, Any]
    context: dict[str, Any]
    answer: str

    merged_context: dict[str, Any]
    missing: list[str]
    complete: bool

    question: str | None
    plan: dict[str, Any] | None


# 一个具体的学习任务
class PlanTask(BaseModel):
    title: str
    description: str
    estimated_minutes: int = Field(gt=0)


# 一个阶段
class PlanMilestone(BaseModel):
    title: str
    objective: str
    tasks: list[PlanTask]


# 整体学习计划
class StudyPlan(BaseModel):
    summary: str
    milestones: list[PlanMilestone]


class InfoEvaluation(BaseModel):
    current_level: str | None = None
    daily_minutes: int | None = None
    learning_preference: str | None = None

    missing: list[str] = Field(default_factory=list)
    question: str | None = None
    complete: bool = False
