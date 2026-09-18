from typing import cast

from langchain_core.messages import HumanMessage, SystemMessage

from app.infrastructure.ai.model import get_chat_model

from ..contracts.context import AgentExecutionContext
from ..contracts.result import AgentResult
from .decision import OrchestratorDecision
from .prompts import ORCHESTRATOR_SYSTEM_PROMPT


class LLMDecisionEngine:
    def __init__(self) -> None:
        self.model = get_chat_model().with_structured_output(OrchestratorDecision)

    async def decide(
        self,
        context: AgentExecutionContext,
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
        context: AgentExecutionContext,
        worker_result: AgentResult | None,
    ) -> str:

        worker_result_text = (
            worker_result.model_dump_json() if worker_result else "None"
        )

        return f"""
Current user input:
{context.user_input or "None"}

Goal ID:
{context.goal_id or "None"}

Conversation:
{context.conversation}

Working memory:
{context.working_memory}

Environment:
{context.environment}

Metadata:
{context.metadata}

Previous worker result:
{worker_result_text}
"""
