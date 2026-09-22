from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agents.session.models import AgentMessage, AgentSession
from app.modules.agents.session.schemas import AgentSessionCreateData


class AgentSessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, session_id: int) -> AgentSession | None:
        return await self.db.get(AgentSession, session_id)

    async def create(self, data: AgentSessionCreateData) -> AgentSession:
        # model_dump: 把Pydantic对象转换为字典
        session = AgentSession(**data.model_dump())
        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)
        return session

    async def get_resumable_session(
        self,
        user_id: int,
        goal_id: int | None = None,
        agent_type: str | None = None,
        include_completed: bool = False,
    ) -> AgentSession | None:
        stmt = select(AgentSession).where(
            AgentSession.user_id == user_id,
            AgentSession.goal_id == goal_id,
        )
        if not include_completed:
            stmt = stmt.where(
                AgentSession.status.in_(("pending", "active", "paused", "failed"))
            )
        if agent_type is not None:
            stmt = stmt.where(AgentSession.agent_type == agent_type)
        session = await self.db.execute(stmt.order_by(AgentSession.updated_at.desc()))
        return session.scalars().first()

    async def list_messages(self, session_id: int, *, limit: int = 50, offset: int = 0):
        result = await self.db.execute(
            select(AgentMessage)
            .where(AgentMessage.session_id == session_id)
            .order_by(AgentMessage.sequence.asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_messages(self, session_id: int) -> int:
        result = await self.db.execute(
            select(func.count(AgentMessage.id)).where(
                AgentMessage.session_id == session_id
            )
        )
        return int(result.scalar_one())

    async def append_message(
        self,
        session_id: int,
        *,
        role: str,
        content: str,
        message_type: str = "text",
        message_metadata: dict | None = None,
        token_count: int | None = None,
    ) -> AgentMessage:
        result = await self.db.execute(
            select(func.coalesce(func.max(AgentMessage.sequence), 0)).where(
                AgentMessage.session_id == session_id
            )
        )
        message = AgentMessage(
            session_id=session_id,
            sequence=int(result.scalar_one()) + 1,
            role=role,
            content=content,
            message_type=message_type,
            message_metadata=message_metadata or {},
            token_count=token_count,
        )
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def claim_execution(
        self, session_id: int, *, lease_seconds: int = 120
    ) -> str | None:
        token = uuid4().hex
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(AgentSession)
            .where(
                AgentSession.id == session_id,
                or_(
                    AgentSession.execution_token.is_(None),
                    AgentSession.execution_expires_at < now,
                ),
            )
            .values(
                execution_token=token,
                execution_expires_at=now + timedelta(seconds=lease_seconds),
            )
        )
        await self.db.commit()
        return token if result.rowcount == 1 else None

    async def finish_execution(
        self,
        session_id: int,
        token: str,
        *,
        stage: str | None = None,
        status: str | None = None,
        context: dict | None = None,
        last_message_id: int | None = None,
    ) -> bool:
        values = {"execution_token": None, "execution_expires_at": None}
        if stage is not None:
            values["stage"] = stage
        if status is not None:
            values["status"] = status
        if context is not None:
            values["context"] = context
        if last_message_id is not None:
            values["last_message_id"] = last_message_id
        result = await self.db.execute(
            update(AgentSession)
            .where(AgentSession.id == session_id, AgentSession.execution_token == token)
            .values(**values)
        )
        await self.db.commit()
        return result.rowcount == 1
