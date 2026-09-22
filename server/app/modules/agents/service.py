import asyncio
import json
import logging
from collections.abc import AsyncIterator
from datetime import datetime

from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.ai.service import LLMService
from app.modules.agents.session.models import AgentSession
from app.modules.agents.session.schemas import AgentSessionCreateData
from app.modules.agents.session.service import AgentSessionService
from app.modules.agents.workflow.goal_planning.graph import (
    GoalPlanState,
    build_goal_plan_graph,
)
from app.modules.agents.workflow.goal_planning.state import StudyPlan
from app.modules.goals.models import GoalPlan, GoalPlanItem, Goals, LearningTask
from app.modules.nodes.schemas import NodeCreate
from app.modules.nodes.service import SpaceNodeService
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
        """Keep post-header failures inside the SSE protocol."""
        try:
            async for event in self._message_stream(goal_id, user_id, request):
                yield event
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("goal agent stream failed, goal_id=%s", goal_id)
            yield self._error("流式服务异常，请稍后重试", code="STREAM_ERROR")

    async def _message_stream(
        self, goal_id: int, user_id: int, request
    ) -> AsyncIterator[str]:
        goal = await self.session.get(Goals, goal_id)

        if not goal or goal.user_id != user_id:
            yield self._error("目标不存在或无权访问", code="GOAL_ACCESS_DENIED")
            return

        try:
            agent_session = await self.agent_session_service.create_or_resume(
                session_id=request.session_id,
                data=AgentSessionCreateData(
                    goal_id=goal_id,
                    user_id=user_id,
                    agent_type="goal_planning",
                    context={},
                ),
            )
        except ValueError:
            yield self._error(
                "Agent 会话不存在或无权访问", code="SESSION_ACCESS_DENIED"
            )
            return

        if not agent_session:
            yield self._error("Agent 会话不存在", code="SESSION_NOT_FOUND")
            return

        execution_token = await self.agent_session_service.repository.claim_execution(
            agent_session.id
        )
        if execution_token is None:
            yield self._error("当前会话正在处理中，请稍后重试", code="SESSION_BUSY")
            return

        context = dict(agent_session.context or {})

        # 首次请求只建立会话并返回首个问题，不应触发一次空回答的图执行。
        if not request.message.strip():
            question = context.get("last_question") or self._question("current_level")
            if not context.get("last_question"):
                await self.agent_session_service.repository.append_message(
                    agent_session.id,
                    role="assistant",
                    content=question,
                    message_type="question",
                )
                await self.agent_session_service.update(
                    agent_session.id,
                    stage="collecting_info",
                    status="active",
                    context={**context, "last_question": question},
                )
                await self.agent_session_service.repository.finish_execution(
                    agent_session.id, execution_token,
                    stage="collecting_info",
                    status="active",
                    context={**context, "last_question": question},
                )
            else:
                await self.agent_session_service.repository.finish_execution(
                    agent_session.id, execution_token,
                    stage="collecting_info", status="active", context=context
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
        await self.agent_session_service.repository.append_message(
            agent_session.id, role="user", content=request.message
        )
        # 将用户输入先提交为不可变历史；后续 LLM/计划事务失败不能回滚掉用户消息。
        await self.session.commit()
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

            yield self._error(
                "生成学习计划失败，请稍后重试", code="PLAN_GENERATION_FAILED"
            )
            await self.agent_session_service.repository.finish_execution(
                agent_session.id, execution_token
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
                execution_token,
            ):
                yield event

            return

        if complete and plan:
            async for event in self._handle_plan_ready(
                agent_session,
                merged_context,
                plan,
                execution_token,
            ):
                yield event

            return

        await self.agent_session_service.repository.finish_execution(
            agent_session.id, execution_token, context=merged_context
        )
        yield self._error("未知的执行结果", code="UNKNOWN_AGENT_RESULT")

    async def _handle_missing_info(
        self,
        agent_session,
        merged_context: dict,
        question: str | None,
        execution_token: str,
    ) -> AsyncIterator[str]:

        if not question:
            await self.agent_session_service.repository.finish_execution(
                agent_session.id, execution_token
            )
            yield self._error(
                "生成追问失败，请稍后重试", code="QUESTION_GENERATION_FAILED"
            )
            return

        message = await self.agent_session_service.repository.append_message(
            agent_session.id,
            role="assistant", content=question, message_type="question"
        )
        await self.agent_session_service.repository.finish_execution(
            agent_session.id,
            execution_token,
            stage="collecting_info",
            status="active",
            context={**merged_context, "last_question": question},
            last_message_id=message.id,
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
        execution_token: str,
    ) -> AsyncIterator[str]:

        if not plan:
            yield self._error("计划结果为空，请稍后重试", code="EMPTY_PLAN")
            return

        plan_text = self._format_plan_message(plan) or "学习计划已生成，等待你的确认。"
        message = await self.agent_session_service.repository.append_message(
            agent_session.id,
            role="assistant", content=plan_text, message_type="plan",
            message_metadata={"plan": plan}
        )
        await self.agent_session_service.repository.finish_execution(
            agent_session.id, execution_token,
            stage="awaiting_plan_confirmation", status="active",
            context={**merged_context, "pending_plan": plan}, last_message_id=message.id
        )

        yield self._event(
            "plan_ready",
            {
                "stage": "awaiting_plan_confirmation",
                "session_id": agent_session.id,
                "plan": jsonable_encoder(plan),
                "message": (
                    "我已经根据你的情况生成了学习计划。"
                    "请确认后，我会将它正式加入学习空间。"
                ),
                "actions": [
                    {"type": "confirm_plan", "label": "确认计划"},
                    {"type": "modify_plan", "label": "调整计划"},
                ],
            },
        )

    @staticmethod
    def _event(event_type: str, data: dict) -> str:
        return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    @staticmethod
    def _format_plan_message(plan: dict) -> str:
        """把学习计划格式化为 Markdown 文本，作为历史消息持久化。"""
        sections: list[str] = []

        summary = plan.get("summary")
        if summary:
            sections.append(f"**学习计划**\n\n{summary}")

        for index, milestone in enumerate(plan.get("milestones") or [], start=1):
            lines = [f"### {index}. {milestone.get('title') or '学习阶段'}"]
            objective = milestone.get("objective")
            if objective:
                lines.append(objective)
            for task in milestone.get("tasks") or []:
                title = task.get("title") or "学习任务"
                description = task.get("description")
                estimated_minutes = task.get("estimated_minutes")
                duration = (
                    f"（预计 {estimated_minutes} 分钟）" if estimated_minutes else ""
                )
                lines.append(
                    f"- **{title}**{duration}"
                    f"{f'：{description}' if description else ''}"
                )
            sections.append("\n\n".join(lines))

        return "\n\n".join(sections)

    @classmethod
    def _error(cls, message: str, *, code: str) -> str:
        return cls._event("error", {"code": code, "message": message})

    @staticmethod
    def _question(field: str) -> str:
        return {
            "current_level": (
                "你目前在这个目标上是什么水平？例如：零基础、了解基础、可以完成简单项目。"
            ),
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

        execution_token = await self.agent_session_service.repository.claim_execution(
            session_id
        )
        if execution_token is None:
            raise BadRequestException("当前会话正在处理中，请稍后重试")

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

        # 6. 在一个事务中完成所有变更。异常时 rollback 后 session 仍保持待确认。
        # 任一步失败都整体回滚，避免出现"计划成功但 LearningTask 未保存"。
        try:
            active_result = await self.session.execute(
                select(GoalPlan).where(
                    GoalPlan.goal_id == goal_id,
                    GoalPlan.user_id == user_id,
                    GoalPlan.status == "active",
                )
            )
            for active_plan in active_result.scalars().all():
                active_plan.status = "superseded"

            # 7.1 创建 GoalPlan
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

            # 7.2 创建 GoalPlanItem 并 flush 以拿到 plan_item.id
            for index, milestone in enumerate(
                study_plan.milestones,
                start=1,
            ):
                estimated_minutes = sum(
                    task.estimated_minutes for task in milestone.tasks
                )

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
                await self.session.flush()

                # 7.3 为 milestone.tasks 持久化 LearningTask
                #     先 flush GoalPlanItem，取得 plan_item.id 后再创建 LearningTask。
                for task in milestone.tasks:
                    learning_task = LearningTask(
                        goal_id=goal_id,
                        plan_item_id=plan_item.id,
                        user_id=user_id,
                        title=task.title,
                        description=task.description,
                        estimated_minutes=task.estimated_minutes,
                        status="not_started",
                    )
                    self.session.add(learning_task)
                    await self.session.flush()

            # 7.4 为已持久化的 GoalPlan 创建 Canvas 节点。
            #     节点与计划使用同一个 session/事务，计划相关数据任一环节失败时
            #     会一起回滚，避免出现业务数据与 Canvas 数据不一致。
            await SpaceNodeService.create(
                self.session,
                goal_id=goal_id,
                user_id=user_id,
                data=NodeCreate(
                    type="course",
                    title=goal.title,
                    # Course nodes are canvas entities only. The plan is resolved
                    # through entity_type/entity_id when the node is read.
                    content={"kind": "course"},
                    entity_type="goal_plan",
                    entity_id=goal_plan.id,
                ),
            )

            # 8. 更新 AgentSession
            agent_session.stage = "assigned_today"
            agent_session.execution_token = None
            agent_session.execution_expires_at = None
            agent_session.context = {
                key: value
                for key, value in (agent_session.context or {}).items()
                if key != "pending_plan" and key != "last_question"
            }

            # 9. 一次性提交整个事务
            agent_session.status = "completed"
            await self.session.commit()
        except Exception:
            # 任意环节失败都整体回滚，避免计划已写入但 LearningTask 缺失。
            await self.session.rollback()

            # 确认失败时，待确认计划必须仍然可恢复。显式恢复 stage/status，
            # 避免未来在事务中新增状态修改后导致刷新页面丢失确认入口。
            try:
                failed_session = await self.session.get(AgentSession, session_id)
                if failed_session is not None:
                    failed_session.stage = "awaiting_plan_confirmation"
                    # Keep the business stage recoverable while exposing the
                    # failed confirmation attempt through the existing
                    # AgentSession status enum.
                    failed_session.status = "failed"
                    failed_session.execution_token = None
                    failed_session.execution_expires_at = None
                    await self.session.commit()
            except Exception:
                await self.session.rollback()
                logger.exception(
                    "failed to restore pending plan confirmation, session_id=%s",
                    session_id,
                )

            logger.exception(
                "confirm_plan persistence failed, goal_id=%s, session_id=%s",
                goal_id,
                session_id,
            )
            raise

        return {
            "message": "学习计划已确认",
            "session_id": agent_session.id,
            "plan_id": goal_plan.id,
            "stage": agent_session.stage,
            "status": agent_session.status,
            "version": goal_plan.version,
            "plan": plan_content,
        }
