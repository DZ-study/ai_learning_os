from typing import Protocol

from .context import AgentExecutionContext
from .result import AgentResult


class AgentWorker(Protocol):
    """
    所有 Worker Agent 必须遵循的统一协议。
    """

    async def execute(
        self,
        context: AgentExecutionContext,
    ) -> AgentResult: ...
