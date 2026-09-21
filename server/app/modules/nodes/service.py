from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.nodes.models import SpaceNode
from app.modules.nodes.schemas import NodeCreate


class SpaceNodeService:
    """SpaceNode business operations that participate in the caller's transaction."""

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        goal_id: int,
        user_id: int,
        data: NodeCreate,
    ) -> SpaceNode:
        # Entity-backed nodes are idempotent. This also makes retries from a
        # caller safe before the database unique index is consulted.
        if data.entity_type is not None and data.entity_id is not None:
            existing = await db.scalar(
                select(SpaceNode).where(
                    SpaceNode.goal_id == goal_id,
                    SpaceNode.user_id == user_id,
                    SpaceNode.entity_type == data.entity_type,
                    SpaceNode.entity_id == data.entity_id,
                )
            )
            if existing is not None:
                return existing

        existing_positions = await db.scalars(
            select(SpaceNode.position).where(
                SpaceNode.goal_id == goal_id,
                SpaceNode.user_id == user_id,
            )
        )
        occupied = {
            (position.get("x"), position.get("y"))
            for position in existing_positions
            if isinstance(position, dict)
        }

        position = dict(data.position)
        x = position.get("x", 42)
        y = position.get("y", 78)
        while (x, y) in occupied:
            x += 360
            if x > 900:
                x = 42
                y += 220
        position.update(x=x, y=y)

        node = SpaceNode(
            goal_id=goal_id,
            user_id=user_id,
            type=data.type,
            title=data.title,
            content=data.content,
            position=position,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
        )
        db.add(node)
        await db.flush()
        return node
