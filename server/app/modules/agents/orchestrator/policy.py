from ..registry.agent_registry import AgentRegistry
from .actions import OrchestratorAction
from .decision import OrchestratorDecision


class PolicyViolation(Exception):
    """Orchestrator Decision 违反系统策略。"""


class OrchestratorPolicy:
    """
    Orchestrator 决策策略。

    Policy 负责判断：
    “这个 Decision 是否允许被执行？”

    它不负责执行 Worker。
    """

    def __init__(
        self,
        registry: AgentRegistry,
    ) -> None:
        self.registry = registry

    def validate(
        self,
        decision: OrchestratorDecision,
    ) -> None:
        self._validate_action(decision)
        self._validate_target(decision)
        self._validate_consistency(decision)

    def _validate_action(
        self,
        decision: OrchestratorDecision,
    ) -> None:
        if not isinstance(
            decision.action,
            OrchestratorAction,
        ):
            raise PolicyViolation(f"Unsupported action: {decision.action}")

    def _validate_target(
        self,
        decision: OrchestratorDecision,
    ) -> None:
        if decision.action != OrchestratorAction.DELEGATE:
            return

        if not decision.target_agent:
            raise PolicyViolation("DELEGATE requires target_agent")

        if not self.registry.has(decision.target_agent):
            raise PolicyViolation(f"Agent is not registered: {decision.target_agent}")

    def _validate_consistency(
        self,
        decision: OrchestratorDecision,
    ) -> None:
        if (
            decision.action == OrchestratorAction.WAIT_USER
            and not decision.requires_user_input
        ):
            raise PolicyViolation("WAIT_USER requires requires_user_input=True")

        if decision.action == OrchestratorAction.COMPLETE and decision.target_agent:
            raise PolicyViolation("COMPLETE cannot have target_agent")
