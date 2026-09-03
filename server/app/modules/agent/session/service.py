import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agent.session.models import AgentSession
from app.modules.agent.session.repository import AgentSessionRepository
from app.modules.agent.session.schemas import AgentSessionCreateData

logger = logging.getLogger(__name__)


class AgentSessionService:
    def __init__(self, db: AsyncSession, session_repository: AgentSessionRepository):
        self.db = db
        self.repository = session_repository

    async def get_by_id(self, session_id: int) -> AgentSession | None:
        return await self.repository.get_by_id(session_id)

    async def create_or_resume(
        self, *, session_id: int | None, data: AgentSessionCreateData
    ) -> AgentSession | None:
        if session_id is not None:
            session = await self.repository.get_by_id(session_id)

            if session is None:
                return None

            if (
                session.user_id != data.user_id
                or session.goal_id != data.goal_id
                or session.agent_type != data.agent_type
            ):
                raise ValueError("会话ID不匹配")

        else:
            session = await self.repository.get_resumable_session(
                data.user_id, data.goal_id, data.agent_type
            )
        if not session:
            # 创建新的会话
            session = await self.repository.create(data)

        try:
            await self.db.commit()
        except Exception:
            logger.exception(
                "save agent question failed, session_id=%s",
                session.id,
            )
            await self.db.rollback()
            raise
        return session

    async def update(
        self,
        session_id: int,
        *,
        stage: str | None = None,
        context: dict | None = None,
    ) -> AgentSession:
        agent_session = await self.get_by_id(session_id)

        if not agent_session:
            raise ValueError("Agent 会话不存在")

        if stage is not None:
            agent_session.stage = stage

        if context is not None:
            agent_session.context = context

        try:
            await self.db.commit()
            await self.db.refresh(agent_session)
        except Exception:
            await self.db.rollback()
            logger.exception(
                "update agent session failed, session_id=%s",
                session_id,
            )
            raise

        return agent_session
