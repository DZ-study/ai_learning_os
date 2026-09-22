"""Deterministic routing for agent requests.

This resolver only uses state that is already present in the agent context.
It deliberately returns ``None`` when the state is ambiguous so the LLM
router can handle cross-worker intent.
"""

from dataclasses import dataclass

from app.modules.agents.contracts.context import GlobalAgentContext

from .actions import OrchestratorAction
from .decision import OrchestratorDecision


@dataclass(frozen=True, slots=True)
class DeterministicRoute:
    decision: OrchestratorDecision
    reason: str


class DeterministicRouteResolver:
    """Resolve protocol-safe routes without an additional LLM call."""

    _CROSS_WORKER_INTENTS = (
        "修改计划",
        "调整计划",
        "重新规划",
        "学习计划",
        "开始复习",
        "复习一下",
        "复习",
        "review",
        "study plan",
        "revise plan",
    )

    def resolve(self, context: GlobalAgentContext) -> DeterministicRoute | None:
        metadata = context.metadata
        stage = str(metadata.get("stage") or "")
        status = str(metadata.get("status") or "")
        agent_type = str(metadata.get("agent_type") or "")

        # Human-in-the-loop planning states are protocol states. The user must
        # continue the planning workflow before a different worker is selected.
        if stage in {"awaiting_plan_confirmation", "awaiting_confirmation"}:
            return self._delegate(
                "goal_planning",
                "strong planning confirmation state",
            )

        # ``collecting_info`` is interruptible: the user may change intent
        # and ask a normal learning question. Let the intent decision engine
        # handle that case instead of pinning the whole session to planning.
        # Only the actual plan-generation stage is non-interruptible.
        if (
            agent_type == "goal_planning"
            and status in {"pending", "active", "failed"}
            and stage == "generating_plan"
        ):
            return self._delegate(
                "goal_planning",
                "strong goal-planning workflow state",
            )

        # A review session is an explicit active protocol session. Keep it
        # deterministic; an unregistered review worker will fail in Policy,
        # rather than being silently redirected to planning.
        if agent_type == "review" and status == "active":
            return self._delegate("review", "active review session")

        lesson_context = self._lesson_context(context)
        if lesson_context and not self._has_cross_worker_intent(context.user_input):
            lesson_status = str(
                lesson_context.get("status")
                or lesson_context.get("lesson_status")
                or ""
            )
            if lesson_status in {"not_started", "in_progress", "learning", "quiz"}:
                return self._delegate("tutor", "active lesson learning context")

        # An explicit tutor session is safe for ordinary tutor turns. It is a
        # weak/default route when the user asks for another worker's task.
        if (
            agent_type == "tutor"
            and status == "active"
            and not self._has_cross_worker_intent(context.user_input)
        ):
            return self._delegate("tutor", "active tutor session")

        return None

    @staticmethod
    def _lesson_context(context: GlobalAgentContext) -> dict | None:
        for key in ("lesson", "lesson_context", "current_lesson"):
            value = context.working_memory.get(key)
            if isinstance(value, dict):
                return value

        if context.working_memory.get("lesson_id") is not None:
            return {
                "id": context.working_memory.get("lesson_id"),
                "status": context.working_memory.get("lesson_status"),
            }
        return None

    @classmethod
    def _has_cross_worker_intent(cls, user_input: str | None) -> bool:
        normalized = (user_input or "").strip().lower()
        return any(intent.lower() in normalized for intent in cls._CROSS_WORKER_INTENTS)

    @staticmethod
    def _delegate(target_agent: str, reason: str) -> DeterministicRoute:
        return DeterministicRoute(
            decision=OrchestratorDecision(
                action=OrchestratorAction.DELEGATE,
                target_agent=target_agent,
                reason=reason,
            ),
            reason=reason,
        )
