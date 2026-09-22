import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agents.contracts.context import (
    GlobalAgentContext,
    PlanningWorkerContext,
)
from app.modules.agents.contracts.result import AgentResult, AgentResultStatus
from app.modules.agents.session.schemas import AgentSessionCreateData
from app.modules.agents.session.service import AgentSessionService
from app.modules.goals.models import Goals

from .actions import OrchestratorAction
from .decision import OrchestratorDecision
from .decision_engine import LLMDecisionEngine
from .dispatcher import AgentDispatcher
from .policy import OrchestratorPolicy
from .route_resolver import DeterministicRouteResolver

logger = logging.getLogger(__name__)


class Orchestrator:
    """Coordinate one worker turn through decision, policy, and dispatch."""

    def __init__(
        self,
        decision_engine: LLMDecisionEngine,
        dispatcher: AgentDispatcher,
        policy: OrchestratorPolicy,
        db: AsyncSession | None = None,
        agent_session_service: AgentSessionService | None = None,
        route_resolver: DeterministicRouteResolver | None = None,
    ) -> None:
        self.decision_engine = decision_engine
        self.dispatcher = dispatcher
        self.policy = policy
        self.db = db
        self.agent_session_service = agent_session_service
        self.route_resolver = route_resolver or DeterministicRouteResolver()

    async def execute(
        self,
        context: GlobalAgentContext,
        worker_result: AgentResult | None = None,
    ) -> AgentResult:
        deterministic_route = self.route_resolver.resolve(context)
        if deterministic_route is not None:
            route_source = "deterministic"
            decision = deterministic_route.decision
            route_reason = deterministic_route.reason
        else:
            route_source = "llm"
            decision = await self.decision_engine.decide(context, worker_result)
            route_reason = decision.reason or "deterministic route unresolved"

        logger.info(
            "route_source=%s action=%s target_agent=%s reason=%s",
            route_source,
            decision.action,
            decision.target_agent,
            route_reason,
        )
        self.policy.validate(decision)

        if decision.action == OrchestratorAction.DELEGATE:
            return await self._dispatch_to_worker(decision, context)

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
        context: GlobalAgentContext,
        target_agent: str,
        *,
        parameters: dict | None = None,
    ) -> AgentResult:
        """已明确目标 Worker 的直接委派，不做意图识别。

        Chat 等自然语言入口必须使用 execute()，
        由 Decision Engine 根据 user_input 决定 target_agent。
        """

        decision = OrchestratorDecision(
            action=OrchestratorAction.DELEGATE,
            target_agent=target_agent,
            parameters=parameters or {},
        )
        self.policy.validate(decision)
        return await self._dispatch_to_worker(decision, context)

    @staticmethod
    def _to_worker_context(
        context: GlobalAgentContext,
        target_agent: str,
    ) -> GlobalAgentContext | PlanningWorkerContext:
        if target_agent != "goal_planning":
            return context

        return PlanningWorkerContext(
            user_id=context.user_id,
            goal_id=context.goal_id or "",
            session_id=context.session_id,
            user_input=context.user_input,
        )

    async def _dispatch_to_worker(
        self,
        decision: OrchestratorDecision,
        context: GlobalAgentContext,
    ) -> AgentResult:
        if not decision.target_agent:
            raise ValueError("DELEGATE requires target_agent")

        worker_context = self._to_worker_context(context, decision.target_agent)
        return await self.dispatcher.dispatch(decision, worker_context)

    # 构建全局上下文
    async def _build_context(
        self,
        *,
        goal_id: int,
        user_id: int | None,
        request,
    ) -> GlobalAgentContext | AgentResult:
        if user_id is None or request is None:
            return self._failed("INVALID_EXECUTION_CONTEXT", "请求上下文不完整")

        if self.db is None or self.agent_session_service is None:
            raise RuntimeError("Orchestrator context dependencies are not configured")

        goal = await self.db.get(Goals, goal_id)
        if goal is None or goal.user_id != user_id:
            return self._failed("GOAL_ACCESS_DENIED", "目标不存在或无权访问")

        session_id = request.session_id
        agent_type = "goal_planning"

        if session_id is not None:
            requested_session = await self.agent_session_service.get_by_id(session_id)
            if requested_session is None:
                return self._failed("SESSION_NOT_FOUND", "Agent 会话不存在")
            if (
                requested_session.user_id != user_id
                or requested_session.goal_id != goal_id
            ):
                return self._failed(
                    "SESSION_ACCESS_DENIED", "Agent 会话不存在或无权访问"
                )
            agent_type = requested_session.agent_type
        else:
            resumable = (
                await self.agent_session_service.repository.get_resumable_session(
                    user_id=user_id,
                    goal_id=goal_id,
                )
            )
            if resumable is not None:
                session_id = resumable.id
                agent_type = resumable.agent_type

        try:
            agent_session = await self.agent_session_service.create_or_resume(
                session_id=session_id,
                data=AgentSessionCreateData(
                    goal_id=goal_id,
                    user_id=user_id,
                    agent_type=agent_type,
                    context={},
                ),
            )
        except ValueError:
            return self._failed("SESSION_ACCESS_DENIED", "Agent 会话不存在或无权访问")

        if agent_session is None:
            return self._failed("SESSION_NOT_FOUND", "Agent 会话不存在")

        session_context = dict(agent_session.context or {})
        stored_messages = await self.agent_session_service.repository.list_messages(
            agent_session.id, limit=100
        )
        messages = [
            {"role": message.role, "content": message.content}
            for message in stored_messages
        ]

        return GlobalAgentContext(
            user_id=str(user_id),
            session_id=str(agent_session.id),
            goal_id=str(goal_id),
            user_input=request.message,
            conversation=messages,
            working_memory={
                key: value for key, value in session_context.items()
            },
            environment={
                "goal": {
                    "title": goal.title,
                    "description": goal.description,
                    "duration": goal.duration,
                    "available_time": goal.available_time,
                }
            },
            metadata={
                "agent_type": agent_session.agent_type,
                "stage": agent_session.stage,
                "status": agent_session.status,
            },
        )

    @staticmethod
    def _failed(code: str, message: str) -> AgentResult:
        return AgentResult(
            status=AgentResultStatus.FAILED,
            error_code=code,
            error_message=message,
            message=message,
        )

    async def _resume_or_retry(
        self,
        decision: OrchestratorDecision,
        context: GlobalAgentContext,
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
        return await self._dispatch_to_worker(delegate, context)
