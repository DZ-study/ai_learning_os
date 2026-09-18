from app.modules.agents.contracts.context import AgentExecutionContext
from app.modules.agents.contracts.result import AgentResult, AgentResultStatus

from .actions import OrchestratorAction
from .decision import OrchestratorDecision
from .decision_engine import LLMDecisionEngine
from .dispatcher import AgentDispatcher
from .policy import OrchestratorPolicy


class Orchestrator:
    """Coordinate one worker turn through decision, policy, and dispatch."""

    def __init__(
        self,
        decision_engine: LLMDecisionEngine,
        dispatcher: AgentDispatcher,
        policy: OrchestratorPolicy,
    ) -> None:
        self.decision_engine = decision_engine
        self.dispatcher = dispatcher
        self.policy = policy

    async def execute(
        self,
        context: AgentExecutionContext,
        worker_result: AgentResult | None = None,
    ) -> AgentResult:
        decision = await self.decision_engine.decide(context, worker_result)
        self.policy.validate(decision)

        if decision.action == OrchestratorAction.DELEGATE:
            return await self.dispatcher.dispatch(decision, context)

        if decision.action in (
            OrchestratorAction.RESUME,
            OrchestratorAction.RETRY,
        ):
            return await self._resume_or_retry(decision, context)

        if decision.action == OrchestratorAction.WAIT_USER:
            return AgentResult(
                status=AgentResultStatus.WAITING_USER,
                message=decision.reason or "等待用户输入",
                next_hint=decision.parameters.get("question"),
            )

        if decision.action == OrchestratorAction.COMPLETE:
            return AgentResult(
                status=AgentResultStatus.COMPLETED,
                output=decision.parameters,
                message=decision.reason or "工作流已完成",
            )

        if decision.action == OrchestratorAction.FAIL:
            return AgentResult(
                status=AgentResultStatus.FAILED,
                output=decision.parameters,
                message=decision.reason or "工作流执行失败",
                error_code="ORCHESTRATOR_FAILED",
                error_message=decision.reason or "工作流执行失败",
            )

        raise ValueError(f"Unsupported orchestrator action: {decision.action}")

    async def delegate(
        self,
        target_agent: str,
        context: AgentExecutionContext,
        *,
        parameters: dict | None = None,
    ) -> AgentResult:
        """Dispatch a known entry-point request without another LLM decision.

        Domain routes already know which workflow they expose.  They still go
        through the same policy and dispatcher path as LLM-selected actions.
        """

        decision = OrchestratorDecision(
            action=OrchestratorAction.DELEGATE,
            target_agent=target_agent,
            parameters=parameters or {},
        )
        self.policy.validate(decision)
        return await self.dispatcher.dispatch(decision, context)

    async def _resume_or_retry(
        self,
        decision: OrchestratorDecision,
        context: AgentExecutionContext,
    ) -> AgentResult:
        target_agent = decision.target_agent or context.metadata.get("current_agent")
        if not target_agent:
            return AgentResult(
                status=AgentResultStatus.FAILED,
                message="恢复或重试缺少目标 Agent",
                error_code="MISSING_TARGET_AGENT",
                error_message="恢复或重试缺少目标 Agent",
            )

        delegate = OrchestratorDecision(
            action=OrchestratorAction.DELEGATE,
            target_agent=target_agent,
            reason=decision.reason,
            parameters=decision.parameters,
        )
        self.policy.validate(delegate)
        return await self.dispatcher.dispatch(delegate, context)
