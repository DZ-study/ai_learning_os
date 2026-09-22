from app.modules.agents.contracts.worker import AgentWorker
from app.modules.agents.service import GoalAgentService
from app.modules.agents.workflow.goal_planning.worker import GoalPlanningWorker
from app.modules.agents.workflow.tutor.worker import TutorWorker


class AgentRegistry:
    """
    Worker 注册中心

    Orchestrator 不直接 import / new 各种 Worker，
    而是通过 Registry 获取
    """

    def __init__(self) -> None:
        self._workers: dict[str, AgentWorker] = {}

    def register(
        self,
        name: str,
        worker: AgentWorker,
    ) -> None:
        if name in self._workers:
            raise ValueError(f"Agent already registered: {name}")

        self._workers[name] = worker

    def get(
        self,
        name: str,
    ) -> AgentWorker:
        try:
            return self._workers[name]
        except KeyError as exc:
            raise ValueError(f"Agent not registered: {name}") from exc

    def has(
        self,
        name: str,
    ) -> bool:
        return name in self._workers

    def names(self) -> list[str]:
        return list(self._workers.keys())


def build_agent_registry(goal_agent: GoalAgentService) -> AgentRegistry:
    """Build the application registry for one request-scoped agent service."""

    registry = AgentRegistry()
    registry.register("goal_planning", GoalPlanningWorker(goal_agent))
    registry.register("tutor", TutorWorker(goal_agent.llm))
    return registry
