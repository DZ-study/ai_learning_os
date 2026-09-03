import logging

from app.infrastructure.ai.model import get_chat_model
from app.modules.agent.workflow.goal_planning.state import (
    GoalPlanState,
    InfoEvaluation,
    StudyPlan,
)

logger = logging.getLogger(__name__)


def evaluate_missing(state: GoalPlanState):
    context = {
        **state.get("context", {}),
        **state.get("profile", {}),
    }

    missing = []

    if not context.get("current_level"):
        missing.append("current_level")

    if not context.get("daily_minutes") and not (state.get("goal") or {}).get(
        "available_time"
    ):
        missing.append("daily_minutes")

    if not context.get("learning_preference"):
        missing.append("learning_preference")

    return {
        "merged_context": context,
        "missing": missing,
        "next_step": ("ask_question" if missing else "generate_plan"),
    }


def ask_question(state: GoalPlanState):
    return {}
    # questions = {
    #     "current_level": "你目前是什么水平？例如零基础、了解基础、可以完成简单项目。",
    #     "daily_minutes": "你每天大约可以投入多少分钟学习？",
    #     "learning_preference": "你更喜欢视频、文章、项目实践，还是混合学习？",
    # }

    # field = (state.get("missing") or ["current_level"])[0]

    # return {"question": questions[field]}


async def generate_plan(state: GoalPlanState):
    model = get_chat_model().with_structured_output(StudyPlan)

    response = await model.ainvoke(
        [
            (
                "system",
                """
                你是学习规划助手。
                请根据目标和用户信息生成具体、可执行的学习计划。
                任务必须包含预计学习分钟数。
                """,
            ),
            (
                "human",
                f"""
              目标：{state.get("goal") or {}}
              用户信息：{state.get("merged_context")}
              """,
            ),
        ]
    )

    if response is None:
        raise ValueError("generate_plan: LLM 返回了 None")

    profile = StudyPlan.model_validate(response)

    return {"plan": profile.model_dump()}


async def evaluate_info(state: GoalPlanState):

    model = get_chat_model().with_structured_output(InfoEvaluation)

    prompt = f"""
        你是一个学习规划 Agent。

        用户的目标：
        {state.get("goal", {})}

        已有上下文：
        {state.get("context", {})}

        用户刚刚的回答：
        {state.get("answer", "")}

        你需要判断制定学习计划所需的信息是否完整。

        必须关注以下信息：

        1. current_level：用户当前水平
        2. daily_minutes：每天可以投入多少时间
        3. learning_preference：学习偏好，例如项目实践、理论学习、视频、文章等

        要求：

        1. 从已有上下文和用户刚刚的回答中提取信息。
        2. 用户一次回答可能包含多个信息，全部提取。
        3. 不要重复询问已经明确的信息。
        4. 如果信息不完整，只询问一个最重要的缺失信息。
        5. 问题必须结合用户的目标和已有信息自然生成。
        6. 不要机械地询问字段名称。
        7. 如果信息已经足够，complete=true。
        8. complete=true 时，question 必须为 null。
    """

    response = await model.ainvoke(
        [
            ("system", prompt),
            (
                "human",
                f"""
        学习目标：{state.get("goal") or {}}
        已收集到的信息：{state.get("merged_context")}
        用户最新回答：{state.get("answer")}
        请判断当前信息是否足够制定学习计划。
        """,
            ),
        ]
    )

    # 把 LLM 返回的结果，交给 Pydantic 的 InfoEvaluation 模型进行校验，并转换成一个 InfoEvaluation 对象。
    response = InfoEvaluation.model_validate(response)

    logger.info("evaluate_info: %s", response)

    state_context = state.get("context", {})
    merged_context = {
        **state_context,
        "current_level": response.current_level or state_context.get("current_level"),
        "daily_minutes": response.daily_minutes or state_context.get("daily_minutes"),
        "learning_preference": response.learning_preference
        or state_context.get("learning_preference"),
    }

    return {
        "merged_context": merged_context,
        "complete": response.complete,
        "missing": response.missing,
        "question": response.question,
    }
