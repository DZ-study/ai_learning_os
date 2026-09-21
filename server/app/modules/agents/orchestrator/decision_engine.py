from typing import cast

from langchain_core.messages import HumanMessage, SystemMessage

from app.infrastructure.ai.model import get_chat_model
from app.infrastructure.ai.prompts.prompt import ORCHESTRATOR_SYSTEM_PROMPT

from ..contracts.context import GlobalAgentContext
from ..contracts.result import AgentResult
from .decision import OrchestratorDecision


class LLMDecisionEngine:
    def __init__(self) -> None:
        self.model = get_chat_model().with_structured_output(OrchestratorDecision)

    async def decide(
        self,
        context: GlobalAgentContext,
        worker_result: AgentResult | None = None,
    ) -> OrchestratorDecision:

        messages = [
            SystemMessage(content=ORCHESTRATOR_SYSTEM_PROMPT),
            HumanMessage(
                content=self._build_context_message(
                    context,
                    worker_result,
                )
            ),
        ]

        result = await self.model.ainvoke(messages)

        return cast(
            OrchestratorDecision,
            result,
        )

    def _build_context_message(
        self,
        context: GlobalAgentContext,
        worker_result: AgentResult | None,
    ) -> str:

        worker_result_text = (
            worker_result.model_dump_json() if worker_result else "None"
        )
        workflow_state = {
            key: value
            for key, value in context.metadata.items()
            if key
            in {"current_worker", "current_task", "agent_type", "stage", "status"}
        }
        goal = context.environment.get("goal", {})
        other_environment = {
            key: value
            for key, value in context.environment.items()
            if key != "goal"
        }

        return f"""
## 当前用户请求
{context.user_input or "None"}

## 当前工作流状态
{workflow_state or "None"}

## 当前目标
goal_id: {context.goal_id or "None"}
{goal or "None"}

## 当前学习上下文
working_memory: {context.working_memory or "None"}
environment: {other_environment or "None"}

## 必要历史上下文
{context.conversation or "None"}

## 上一个 Worker 的结果
{worker_result_text}
"""
