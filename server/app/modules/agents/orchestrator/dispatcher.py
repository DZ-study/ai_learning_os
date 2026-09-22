import logging

from ..contracts.context import GlobalAgentContext, PlanningWorkerContext
from ..contracts.result import AgentResult
from ..registry.agent_registry import AgentRegistry
from .actions import OrchestratorAction
from .decision import OrchestratorDecision

logger = logging.getLogger(__name__)


class AgentDispatcher:
    def __init__(
        self,
        registry: AgentRegistry,
    ) -> None:
        self.registry = registry

    async def dispatch(
        self,
        decision: OrchestratorDecision,
        context: GlobalAgentContext | PlanningWorkerContext,
    ) -> AgentResult:

        if decision.action != OrchestratorAction.DELEGATE:
            raise ValueError("Dispatcher only handles DELEGATE actions")

        if not decision.target_agent:
            raise ValueError("DELEGATE requires target_agent")

        worker = self.registry.get(decision.target_agent)

        logger.info(
            "dispatching worker target_agent=%s worker=%s",
            decision.target_agent,
            worker.__class__.__name__,
        )

        return await worker.execute(context)
