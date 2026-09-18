from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class AgentExecutionContext:
    """
    Worker 执行上下文。

    Orchestrator 负责构建 Context，
    Worker 只消费 Context，不负责自行拼装全局上下文。
    """

    user_id: str
    session_id: str

    goal_id: str | None = None

    user_input: str | None = None

    # 短期上下文
    conversation: list[dict[str, Any]] = field(default_factory=list)

    # 运行时工作记忆
    working_memory: dict[str, Any] = field(default_factory=dict)

    # 环境感知记忆
    environment: dict[str, Any] = field(default_factory=dict)

    #
    metadata: dict[str, Any] = field(default_factory=dict)
