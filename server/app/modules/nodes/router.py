from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.core.dependencies import get_current_user
from app.modules.goals.models import Goals
from app.modules.nodes.models import SpaceNode
from app.modules.nodes.schemas import NodeCreate, NodeResponse
from app.modules.user.models import User

router = APIRouter(prefix="/goals/{goal_id}/nodes", tags=["Goal Nodes"])


async def _get_owned_goal(goal_id: int, user: User, db: AsyncSession) -> Goals:
    goal = await db.scalar(
        select(Goals).where(Goals.id == goal_id, Goals.user_id == user.id)
    )
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="目标不存在")
    return goal


@router.get("", response_model=list[NodeResponse])
async def list_nodes(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_goal(goal_id, current_user, db)
    result = await db.scalars(
        select(SpaceNode)
        .where(SpaceNode.goal_id == goal_id, SpaceNode.user_id == current_user.id)
        .order_by(SpaceNode.created_at)
    )
    return list(result)


@router.post("", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    goal_id: int,
    data: NodeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_goal(goal_id, current_user, db)
    node = SpaceNode(
        goal_id=goal_id,
        user_id=current_user.id,
        type=data.type,
        title=data.title,
        content=data.content,
        position=data.position,
    )
    db.add(node)
    await db.commit()
    await db.refresh(node)
    return node
