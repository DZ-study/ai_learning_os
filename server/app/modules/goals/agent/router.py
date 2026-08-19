from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_current_user, get_goal_agent_service
from app.modules.goals.agent.service import GoalAgentService
from app.modules.goals.agent.schemas import AgentReplyRequest
from app.modules.user.models import User

router = APIRouter(prefix="/goals/{goal_id}/agent", tags=["Goal Agent"])


@router.post("/start")
async def start_agent(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    service: GoalAgentService = Depends(get_goal_agent_service),
):
    return await service.start(goal_id=goal_id, user_id=current_user.id)


@router.post("/messages/stream")
async def message_stream(
    goal_id: int,
    request: AgentReplyRequest,
    current_user: User = Depends(get_current_user),
    service: GoalAgentService = Depends(get_goal_agent_service),
):
    return StreamingResponse(
        service.message_stream(goal_id, current_user.id, request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
