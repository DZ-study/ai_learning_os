import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from app.modules.agents.contracts.context import PlanningWorkerContext
from app.modules.agents.contracts.result import AgentResult, AgentResultStatus
from app.modules.agents.contracts.worker import AgentWorker
from app.modules.agents.schemas import AgentReplyRequest
from app.modules.agents.service import GoalAgentService

logger = logging.getLogger(__name__)


class GoalPlanningWorker(AgentWorker):
    """Adapt the existing goal-planning SSE agent to the worker contract.

    ``GoalAgentService`` remains the owner of the goal-planning workflow.  The
    worker deliberately calls its existing stream entry point so session
    creation/resume, graph execution, persistence, and SSE error handling all
    continue to have one implementation.
    """

    def __init__(self, agent: GoalAgentService) -> None:
        self.agent = agent

    async def execute(
        self,
        context: PlanningWorkerContext,
    ) -> AgentResult:
        try:
            goal_id = self._parse_required_id(context.goal_id, "goal_id")
            user_id = self._parse_required_id(context.user_id, "user_id")
            session_id = self._parse_optional_id(context.session_id)
        except ValueError as exc:
            return self._failed("INVALID_EXECUTION_CONTEXT", str(exc))

        try:
            events = self.agent.message_stream(
                goal_id=goal_id,
                user_id=user_id,
                request=AgentReplyRequest(
                    session_id=session_id,
                    message=context.user_input or "",
                ),
            )
            return await self._consume_events(events)
        except Exception as exc:
            logger.exception(
                "goal planning worker failed, session_id=%s, goal_id=%s",
                context.session_id,
                context.goal_id,
            )
            return self._failed("GOAL_PLANNING_FAILED", str(exc))

    async def _consume_events(self, events: AsyncIterator[str]) -> AgentResult:
        last_status: dict[str, Any] | None = None
        last_event: dict[str, Any] | None = None

        async for raw_event in events:
            event_type, data = self._parse_sse_event(raw_event)
            last_event = data

            if event_type == "error":
                return self._failed(
                    str(data.get("code") or "GOAL_PLANNING_FAILED"),
                    str(data.get("message") or "Goal Planning 执行失败"),
                    output=data,
                )

            if event_type == "status":
                last_status = data
                continue

            if event_type == "plan_ready":
                return AgentResult(
                    status=AgentResultStatus.COMPLETED,
                    output=data,
                    message=str(data.get("message") or "学习计划已生成"),
                    artifacts=self._plan_artifacts(data),
                )

            if event_type == "done":
                if data.get("question") or data.get("stage") == "collecting_info":
                    question = data.get("question")
                    return AgentResult(
                        status=AgentResultStatus.WAITING_USER,
                        output=data,
                        message=question or "等待你的回答...",
                        next_hint=question,
                    )

        if last_status is not None:
            return AgentResult(
                status=AgentResultStatus.CONTINUE,
                output=last_event or last_status,
                message=last_status.get("message"),
            )

        return self._failed(
            "EMPTY_AGENT_RESULT",
            "Goal Planning 未返回结果",
            output=last_event or {},
        )

    @staticmethod
    def _parse_sse_event(raw_event: str) -> tuple[str, dict[str, Any]]:
        event_type = "message"
        data_lines: list[str] = []

        for line in raw_event.splitlines():
            if line.startswith("event:"):
                event_type = line.removeprefix("event:").strip()
            elif line.startswith("data:"):
                data_lines.append(line.removeprefix("data:").strip())

        if not data_lines:
            raise ValueError("SSE event has no data")

        payload = json.loads("\n".join(data_lines))
        if not isinstance(payload, dict):
            raise ValueError("SSE event data must be an object")

        return event_type, payload

    @staticmethod
    def _plan_artifacts(data: dict[str, Any]) -> list[dict[str, Any]]:
        plan = data.get("plan")
        if not plan:
            return []
        return [{"type": "study_plan", "data": plan}]

    @staticmethod
    def _parse_required_id(value: str | None, field: str) -> int:
        if value is None or not value.strip():
            raise ValueError(f"{field} is required")
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{field} must be an integer") from exc

    @staticmethod
    def _parse_optional_id(value: str | None) -> int | None:
        if value is None or not value.strip():
            return None
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError("session_id must be an integer") from exc

    @staticmethod
    def _failed(
        error_code: str,
        error_message: str,
        *,
        output: dict[str, Any] | None = None,
    ) -> AgentResult:
        return AgentResult(
            status=AgentResultStatus.FAILED,
            output=output or {},
            error_code=error_code,
            error_message=error_message,
            message=error_message,
        )
