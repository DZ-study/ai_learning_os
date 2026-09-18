"""Agent Tool 接入层。

Global Controller / Tutor Agent 通过 Tool 调用业务模块能力。
Tool 只持有业务 Service，不直接操作数据库。
"""

from app.modules.agents.tools.base import AgentTool, ToolResult
from app.modules.agents.tools.lesson import (
    GenerateLessonContentTool,
    GetLessonContentTool,
    GetLessonInfoTool,
    UpdateLessonStatusTool,
)
from app.modules.agents.tools.registry import ToolRegistry, build_lesson_tool_registry

__all__ = [
    "AgentTool",
    "ToolResult",
    "ToolRegistry",
    "GetLessonInfoTool",
    "GetLessonContentTool",
    "GenerateLessonContentTool",
    "UpdateLessonStatusTool",
    "build_lesson_tool_registry",
]
