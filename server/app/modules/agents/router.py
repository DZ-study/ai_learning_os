from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.core.dependencies import (
    get_current_user,
    get_goal_agent_service,
    get_orchestrator,
)
from app.modules.agents.contracts.result import AgentResult, AgentResultStatus
from app.modules.agents.orchestrator.service import Orchestrator
from app.modules.agents.schemas import AgentConfirmRequest, AgentReplyRequest
from app.modules.agents.service import GoalAgentService
from app.modules.agents.session.schemas import (
    AgentMessageResponse,
    AgentSessionHistoryResponse,
)
from app.modules.user.models import User

router = APIRouter(prefix="/goals/{goal_id}/agent", tags=["Goal Agent"])


@router.get("/session", response_model=AgentSessionHistoryResponse)
async def get_session(
    goal_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: GoalAgentService = Depends(get_goal_agent_service),
):
    session = await service.agent_session_service.repository.get_resumable_session(
        user_id=current_user.id,
        goal_id=goal_id,
        agent_type="goal_planning",
        include_completed=True,
    )
    if session is None:
        return AgentSessionHistoryResponse(
            session_id=0,
            stage="initial",
            status="pending",
            context={},
            messages=[],
            messages_total=0,
        )
    messages = await service.agent_session_service.repository.list_messages(
        session.id, limit=limit, offset=offset
    )
    total = await service.agent_session_service.repository.count_messages(session.id)
    return AgentSessionHistoryResponse(
        session_id=session.id,
        stage=session.stage,
        status=session.status,
        context=session.context or {},
        messages=[
            AgentMessageResponse(
                id=item.id,
                session_id=item.session_id,
                sequence=item.sequence,
                role=item.role,
                content=item.content,
                message_type=item.message_type,
                metadata=item.message_metadata or {},
                token_count=item.token_count,
                created_at=item.created_at,
            )
            for item in messages
        ],
        messages_total=total,
    )


# chat统一入口
@router.post("/messages/stream")
async def message_stream(
    goal_id: int,
    request: AgentReplyRequest,
    current_user: User = Depends(get_current_user),
    orchestrator: Orchestrator = Depends(get_orchestrator),
):
    return StreamingResponse(
        _orchestrated_stream(
            orchestrator,
            goal_id,
            current_user.id,
            request,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _orchestrated_stream(
    orchestrator: Orchestrator,
    goal_id: int,
    user_id: int,
    request: AgentReplyRequest,
) -> AsyncIterator[str]:
    try:
        context_or_error = await orchestrator._build_context(
            goal_id=goal_id,
            user_id=user_id,
            request=request,
        )
        if isinstance(context_or_error, AgentResult):
            result = context_or_error
        else:
            result = await orchestrator.execute(context_or_error)
    except Exception:
        yield GoalAgentService._event(
            "error",
            {"code": "ORCHESTRATOR_FAILED", "message": "流式服务异常，请稍后重试"},
        )
        return

    if result.status == AgentResultStatus.WAITING_USER:
        data = result.output
        yield GoalAgentService._event(
            "status",
            {
                "stage": data.get("stage", "collecting_info"),
                "message": "等待你的回答...",
            },
        )
        if result.message:
            yield GoalAgentService._event("delta", {"content": result.message})
        yield GoalAgentService._event("done", data)
        return

    if (
        result.status == AgentResultStatus.COMPLETED
        and result.output.get("response_type") == "tutor_answer"
    ):
        yield GoalAgentService._event(
            "status",
            {
                "stage": result.output.get("stage", "tutoring"),
                "message": "导师正在回答...",
            },
        )
        if result.message:
            yield GoalAgentService._event("delta", {"content": result.message})
        yield GoalAgentService._event(
            "done",
            {
                "stage": result.output.get("stage", "tutoring"),
                "session_id": result.output.get("session_id"),
            },
        )
        return

    if result.status == AgentResultStatus.COMPLETED:
        yield GoalAgentService._event("plan_ready", result.output)
        return

    if result.status == AgentResultStatus.CONTINUE:
        yield GoalAgentService._event("status", result.output)
        return

    yield GoalAgentService._event(
        "error",
        {
            "code": result.error_code or "GOAL_PLANNING_FAILED",
            "message": result.error_message
            or result.message
            or "生成学习计划失败，请稍后重试",
        },
    )


# 确认计划
@router.post("/confirm")
async def confirm_plan(
    goal_id: int,
    request: AgentConfirmRequest,
    current_user: User = Depends(get_current_user),
    service: GoalAgentService = Depends(get_goal_agent_service),
):

    return await service.confirm_plan(
        goal_id=goal_id, user_id=current_user.id, session_id=request.session_id
    )
