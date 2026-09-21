from ..contracts.context import PlanningWorkerContext
from ..contracts.result import AgentResult
from ..registry.agent_registry import AgentRegistry
from .actions import OrchestratorAction
from .decision import OrchestratorDecision


class AgentDispatcher:
    def __init__(
        self,
        registry: AgentRegistry,
    ) -> None:
        self.registry = registry

    async def dispatch(
        self,
        decision: OrchestratorDecision,
        context: PlanningWorkerContext,
    ) -> AgentResult:

        if decision.action != OrchestratorAction.DELEGATE:
            raise ValueError("Dispatcher only handles DELEGATE actions")

        if not decision.target_agent:
            raise ValueError("DELEGATE requires target_agent")

        worker = self.registry.get(decision.target_agent)

        return await worker.execute(context)
