from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agents.session.models import AgentSession
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
    ) -> AgentSession | None:
        stmt = select(AgentSession).where(
            AgentSession.user_id == user_id,
            AgentSession.goal_id == goal_id,
        )
        if agent_type is not None:
            stmt = stmt.where(AgentSession.agent_type == agent_type)
        session = await self.db.execute(stmt)
        return session.scalars().first()
