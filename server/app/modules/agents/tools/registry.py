"""Agent Tool 注册中心。

Global Controller / Tutor Agent 不直接 import / new 各种 Tool，
而是通过 Registry 获取。
"""

from app.modules.agents.tools.base import AgentTool
from app.modules.agents.tools.lesson import (
    GenerateLessonContentTool,
    GetLessonContentTool,
    GetLessonInfoTool,
    UpdateLessonStatusTool,
)
from app.modules.lessons.service import LessonService


class ToolRegistry:
    """Tool 注册中心。"""

    def __init__(self) -> None:
        self._tools: dict[str, AgentTool] = {}

    def register(self, tool: AgentTool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"Tool already registered: {tool.name}")

        self._tools[tool.name] = tool

    def get(self, name: str) -> AgentTool:
        try:
            return self._tools[name]
        except KeyError as exc:
            raise ValueError(f"Tool not registered: {name}") from exc

    def has(self, name: str) -> bool:
        return name in self._tools

    def names(self) -> list[str]:
        return list(self._tools.keys())


def build_lesson_tool_registry(lesson_service: LessonService) -> ToolRegistry:
    """Build the lesson tool registry for one request-scoped lesson service."""

    registry = ToolRegistry()
    registry.register(GetLessonInfoTool(lesson_service))
    registry.register(GetLessonContentTool(lesson_service))
    registry.register(GenerateLessonContentTool(lesson_service))
    registry.register(UpdateLessonStatusTool(lesson_service))
    return registry
