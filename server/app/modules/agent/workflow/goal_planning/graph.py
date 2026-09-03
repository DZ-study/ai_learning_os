from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.modules.agent.workflow.goal_planning.nodes import (
    ask_question,
    evaluate_info,
    generate_plan,
)
from app.modules.agent.workflow.goal_planning.state import (
    GoalPlanState,
)


# 告诉llm下一步怎么做
def route_after_evaluate(
    state: GoalPlanState,
) -> Literal["ask_question", "generate_plan"]:
    complete = state.get("complete")
    if complete:
        return "generate_plan"
    return "ask_question"


def build_goal_plan_graph():
    builder = StateGraph(GoalPlanState)

    builder.add_node("evaluate_info", evaluate_info)
    builder.add_node("generate_plan", generate_plan)
    builder.add_node("ask_question", ask_question)
    # builder.add_node("evaluate_missing", evaluate_missing)

    builder.add_edge(START, "evaluate_info")
    # builder.add_edge("evaluate_info", "evaluate_missing")

    builder.add_conditional_edges(
        "evaluate_info",
        route_after_evaluate,
        {
            "generate_plan": "generate_plan",
            "ask_question": "ask_question",
        },
    )

    builder.add_edge("ask_question", END)
    builder.add_edge("generate_plan", END)

    return builder.compile()
