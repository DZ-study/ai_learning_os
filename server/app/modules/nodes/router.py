from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.core.dependencies import get_current_user
from app.modules.goals.models import Goals
from app.modules.nodes.models import SpaceNode
from app.modules.nodes.schemas import NodeCreate, NodePositionUpdate, NodeResponse
from app.modules.nodes.service import SpaceNodeService
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
    nodes = list(result)
    repaired = False
    for node in nodes:
        repaired = (
            await SpaceNodeService.repair_course_lesson_ids(
                db,
                node=node,
                user_id=current_user.id,
            )
            or repaired
        )
    if repaired:
        await db.commit()
    return nodes


@router.post("", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    goal_id: int,
    data: NodeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_goal(goal_id, current_user, db)

    node = await SpaceNodeService.create(
        db,
        goal_id=goal_id,
        user_id=current_user.id,
        data=data,
    )
    await db.commit()
    await db.refresh(node)
    return node


@router.patch("/{node_id}/position", response_model=NodeResponse)
async def update_node_position(
    goal_id: int,
    node_id: int,
    data: NodePositionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_goal(goal_id, current_user, db)
    node = await db.scalar(
        select(SpaceNode).where(
            SpaceNode.id == node_id,
            SpaceNode.goal_id == goal_id,
            SpaceNode.user_id == current_user.id,
        )
    )
    if node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="节点不存在")

    node.position = data.position
    await db.commit()
    await db.refresh(node)
    return node


@router.post("/{node_id}/lessons/{lesson_id}/complete", response_model=NodeResponse)
async def complete_node_lesson(
    goal_id: int,
    node_id: int,
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_goal(goal_id, current_user, db)
    node = await db.scalar(
        select(SpaceNode).where(
            SpaceNode.id == node_id,
            SpaceNode.goal_id == goal_id,
            SpaceNode.user_id == current_user.id,
        )
    )
    if node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="节点不存在")

    content = dict(node.content or {})
    chapters = content.get("chapters")
    lesson_found = False
    if isinstance(chapters, list):
        updated_chapters = []
        for chapter in chapters:
            if not isinstance(chapter, dict):
                updated_chapters.append(chapter)
                continue
            updated_chapter = dict(chapter)
            lessons = chapter.get("lessons")
            if isinstance(lessons, list):
                updated_lessons = []
                for lesson in lessons:
                    if isinstance(lesson, dict) and str(lesson.get("id")) == lesson_id:
                        updated_lessons.append({**lesson, "status": "completed"})
                        lesson_found = True
                    else:
                        updated_lessons.append(lesson)
                updated_chapter["lessons"] = updated_lessons
            updated_chapters.append(updated_chapter)
        content["chapters"] = updated_chapters

    if not lesson_found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课时不存在")

    node.content = content
    await db.commit()
    await db.refresh(node)
    return node
