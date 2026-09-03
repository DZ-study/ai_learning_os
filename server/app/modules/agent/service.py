import json
import logging
from collections.abc import AsyncIterator
from datetime import datetime

from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.ai.service import LLMService
from app.modules.agent.session.models import AgentSession
from app.modules.agent.session.schemas import AgentSessionCreateData
from app.modules.agent.session.service import AgentSessionService
from app.modules.agent.workflow.goal_planning.graph import (
    GoalPlanState,
    build_goal_plan_graph,
)
from app.modules.agent.workflow.goal_planning.state import StudyPlan
from app.modules.goals.models import GoalPlan, GoalPlanItem, Goals
from app.shared.exceptions import BadRequestException, NotFoundException

logger = logging.getLogger(__name__)


class GoalAgentService:
    def __init__(
        self,
        llm: LLMService,
        session: AsyncSession,
        agent_session_service: AgentSessionService,
    ) -> None:
        self.session = session
        self.llm = llm
        self.graph = build_goal_plan_graph()
        self.agent_session_service = agent_session_service

    async def message_stream(
        self, goal_id: int, user_id: int, request
    ) -> AsyncIterator[str]:
        goal = await self.session.get(Goals, goal_id)

        if not goal or goal.user_id != user_id:
            yield self._event("error", {"message": "目标不存在或无权访问"})
            return

        try:
            agent_session = await self.agent_session_service.create_or_resume(
                session_id=request.session_id,
                data=AgentSessionCreateData(
                    goal_id=goal_id,
                    user_id=user_id,
                    agent_type="goal_planning",
                    context={"messages": []},
                ),
            )
        except ValueError:
            yield self._event("error", {"message": "Agent 会话不存在或无权访问"})
            return

        if not agent_session:
            yield self._event("error", {"message": "Agent 会话不存在"})
            return

        await self.session.commit()  # 结束数据库操作，开始llm流式交互

        # 读取历史上下文
        context = dict(agent_session.context or {})
        messages = list(context.get("messages", []))

        # 首次请求只建立会话并返回首个问题，不应触发一次空回答的图执行。
        if not request.message.strip():
            question = context.get("last_question") or self._question("current_level")
            if not context.get("last_question"):
                await self.agent_session_service.update(
                    agent_session.id,
                    stage="collecting_info",
                    context={
                        **context,
                        "last_question": question,
                        "messages": [
                            *messages,
                            {"role": "assistant", "content": question},
                        ],
                    },
                )

            yield self._event(
                "status",
                {"stage": "collecting_info", "message": "等待你的回答..."},
            )
            yield self._event("delta", {"content": question})
            yield self._event(
                "done",
                {
                    "stage": "collecting_info",
                    "session_id": agent_session.id,
                    "question": question,
                },
            )
            return

        # 保存本轮用户消息
        messages.append(
            {
                "role": "user",
                "content": request.message,
            }
        )

        context["messages"] = messages
        # context = self._merge_answer(context, request.message)

        yield self._event(
            "status",
            {
                "stage": "analyzing",
                "message": "正在分析你的回答…",
            },
        )

        # 构建 Graph Input
        graph_input: GoalPlanState = {
            "goal": {
                "title": goal.title,
                "description": goal.description,
                "duration": goal.duration,
                "available_time": goal.available_time,
            },
            "context": context,
            "answer": request.message,
            "merged_context": context,
            "missing": [],
            "question": None,
            "plan": None,
            "complete": False,
        }

        try:
            graph_result = await self.graph.ainvoke(graph_input)
        except Exception:
            logger.exception(
                "goal plan graph failed, session_id=%s",
                agent_session.id,
            )
            await self.session.rollback()

            yield self._event(
                "error",
                {
                    "message": "生成学习计划失败，请稍后重试",
                },
            )
            return

        merged_context = graph_result.get("merged_context", context)
        missing = graph_result.get("missing", [])
        plan = graph_result.get("plan")
        complete = graph_result.get("complete", False)

        # ─────────────────────────────
        # 分支一：信息不足，继续追问
        # ─────────────────────────────
        if missing and not complete:
            async for event in self._handle_missing_info(
                agent_session,
                merged_context,
                graph_result.get("question"),
            ):
                yield event

            return

        if complete and plan:
            async for event in self._handle_plan_ready(
                agent_session,
                merged_context,
                plan,
            ):
                yield event

            return

        yield self._event(
            "error",
            {"message": "未知的执行结果"},
        )

    async def _handle_missing_info(
        self,
        agent_session,
        merged_context: dict,
        question: str | None,
    ) -> AsyncIterator[str]:

        if not question:
            yield self._event(
                "error",
                {"message": "生成追问失败，请稍后重试"},
            )
            return

        messages = list(merged_context.get("messages", []))

        messages.append(
            {
                "role": "assistant",
                "content": question,
            }
        )

        await self.agent_session_service.update(
            agent_session.id,
            stage="collecting_info",
            context={
                **merged_context,
                "last_question": question,
                "messages": messages,
            },
        )

        yield self._event(
            "delta",
            {
                "content": question,
            },
        )

        yield self._event(
            "done",
            {
                "stage": "collecting_info",
                "session_id": agent_session.id,
                "question": question,
            },
        )

    async def _handle_plan_ready(
        self,
        agent_session,
        merged_context: dict,
        plan: dict | None,
    ) -> AsyncIterator[str]:

        if not plan:
            yield self._event(
                "error",
                {"message": "计划结果为空，请稍后重试"},
            )
            return

        messages = list(merged_context.get("messages", []))

        messages.append(
            {
                "role": "assistant",
                "content": "学习计划已生成，等待你的确认。",
            }
        )

        await self.agent_session_service.update(
            agent_session.id,
            stage="awaiting_plan_confirmation",
            context={
                **merged_context,
                "pending_plan": plan,
                "messages": messages,
            },
        )

        yield self._event(
            "plan_ready",
            {
                "stage": "awaiting_plan_confirmation",
                "session_id": agent_session.id,
                "plan": jsonable_encoder(plan),
            },
        )

    @staticmethod
    def _event(event_type: str, data: dict) -> str:
        return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    @staticmethod
    def _question(field: str) -> str:
        return {
            "current_level": "你目前在这个目标上是什么水平？例如：零基础、了解基础、可以完成简单项目。",
            "daily_minutes": "你平时每天大约能投入多少时间学习？",
            "learning_preference": "你更偏好视频、文章、项目实践，还是混合学习？",
        }[field]

    async def confirm_plan(
        self,
        goal_id: int,
        user_id: int,
        session_id: int,
    ):
        # 1、查询AgentSession和Goal
        result = await self.session.execute(
            select(AgentSession).where(
                AgentSession.id == session_id,
                AgentSession.goal_id == goal_id,
                AgentSession.user_id == user_id,
            )
        )

        agent_session = result.scalar_one_or_none()
        goal = await self.session.get(Goals, goal_id)

        # 2、检查权限
        if not agent_session or not goal:
            raise NotFoundException("Agent 会话不存在或无权访问")

        # 3. 校验当前阶段
        if agent_session.stage != "awaiting_plan_confirmation":
            raise BadRequestException("当前没有待确认的学习计划")

        # 4. 读取 pending_plan
        pending_plan = (agent_session.context or {}).get("pending_plan")
        if not pending_plan:
            raise BadRequestException("暂无待确认的学习计划")
        try:
            study_plan = StudyPlan.model_validate(pending_plan)
        except ValidationError as exc:
            raise BadRequestException("学习计划格式无效") from exc

        plan_content = study_plan.model_dump()

        # 5. 计算新版本号

        version_result = await self.session.execute(
            select(
                func.coalesce(
                    func.max(GoalPlan.version),
                    0,
                )
            ).where(
                GoalPlan.goal_id == goal_id,
                GoalPlan.user_id == user_id,
            )
        )

        current_version = version_result.scalar_one()
        next_version = int(current_version) + 1

        # 6. 把旧的 active 计划改成 superseded
        active_result = await self.session.execute(
            select(GoalPlan).where(
                GoalPlan.goal_id == goal_id,
                GoalPlan.user_id == user_id,
                GoalPlan.status == "active",
            )
        )

        active_plans = active_result.scalars().all()

        for active_plan in active_plans:
            active_plan.status = "superseded"

        # 7. 创建 GoalPlan
        goal_plan = GoalPlan(
            goal_id=goal_id,
            user_id=user_id,
            version=next_version,
            content=plan_content,
            status="active",
            confirmed_at=datetime.utcnow(),
        )

        self.session.add(goal_plan)
        await self.session.flush()

        # 8. 创建 GoalPlanItem
        for index, milestone in enumerate(
            study_plan.milestones,
            start=1,
        ):
            estimated_minutes = sum(task.estimated_minutes for task in milestone.tasks)

            plan_item = GoalPlanItem(
                plan_id=goal_plan.id,
                phase=index,
                title=milestone.title,
                objective=milestone.objective,
                estimated_minutes=estimated_minutes,
                sort_order=index,
                status="pending",
            )

            self.session.add(plan_item)

        # 9. 更新 AgentSession
        agent_session.stage = "assigned_today"
        agent_session.context = {
            key: value
            for key, value in (agent_session.context or {}).items()
            if key != "pending_plan" and key != "last_question"
        }

        # 10. commit
        await self.session.commit()

        return {
            "message": "学习计划已确认",
            "session_id": agent_session.id,
            "plan_id": goal_plan.id,
            "stage": agent_session.stage,
            "version": goal_plan.version,
            "plan": plan_content,
        }
