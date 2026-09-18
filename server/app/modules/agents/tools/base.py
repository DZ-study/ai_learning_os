"""Agent Tool 基础契约。

所有 Tool 遵循统一协议：持有业务 Service，run() 返回 ToolResult，
业务异常转换为 ok=False 而非抛出，保证 Agent 调用的稳定性。
"""

from typing import Any, Protocol

from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    """Agent Tool 的统一返回。"""

    ok: bool
    data: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class AgentTool(Protocol):
    """所有 Agent Tool 必须遵循的统一协议。"""

    name: str
    description: str

    async def run(self, **kwargs: Any) -> ToolResult: ...
