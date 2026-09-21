from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.ai.model import get_chat_model
from app.infrastructure.ai.service import LLMService
from app.infrastructure.email.client import EmailClient
from app.infrastructure.email.service import EmailService
from app.infrastructure.redis.client import redis_client
from app.infrastructure.redis.service import RedisService
from app.modules.agents.orchestrator.decision_engine import LLMDecisionEngine
from app.modules.agents.orchestrator.dispatcher import AgentDispatcher
from app.modules.agents.orchestrator.policy import OrchestratorPolicy
from app.modules.agents.orchestrator.service import Orchestrator
from app.modules.agents.registry.agent_registry import (
    AgentRegistry,
    build_agent_registry,
)
from app.modules.agents.service import GoalAgentService
from app.modules.agents.session.repository import AgentSessionRepository
from app.modules.agents.session.service import AgentSessionService
from app.modules.agents.tools.registry import ToolRegistry, build_lesson_tool_registry
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
from app.modules.goals.repository import GoalRepository
from app.modules.goals.service import GoalService
from app.modules.lessons.repository import LessonRepository
from app.modules.lessons.service import LessonService
from app.modules.user.models import User
from app.modules.user.repository import UserRepository
from app.modules.user.service import UserService
from app.shared.exceptions import UnauthorizedException

from .database.session import get_db
from .security.jwt import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user_id(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("认证已过期，请重新登录")

    user_id = payload.get("sub")

    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    return int(user_id)


async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> User:
    """获取当前登录用户。依赖 get_current_user_id 解析 token 获取 user_id，
    再通过 UserRepository 从数据库加载 User 对象。"""
    user = await UserRepository(session=session).get_by_id(user_id)
    if not user:
        raise UnauthorizedException("用户不存在或已注销")
    return user


def get_auth_service(session: AsyncSession = Depends(get_db)) -> AuthService:
    """组装 AuthService，注入所有依赖。session 由 FastAPI 依赖框架管理生命周期。"""

    auth_repository = AuthRepository(session=session)
    user_repository = UserRepository(session=session)
    email_service = EmailService(client=EmailClient())
    redis_svc = RedisService(redis_client=redis_client)

    return AuthService(
        session=session,
        auth_repository=auth_repository,
        user_repository=user_repository,
        email_service=email_service,
        redis_service=redis_svc,
    )


def get_user_service(session: AsyncSession = Depends(get_db)) -> UserService:
    """组装 UserService，注入所有依赖。session 由 FastAPI 依赖框架管理生命周期。"""
    user_repository = UserRepository(session=session)
    return UserService(db=session, repository=user_repository)


# ── AI / LLM 依赖 ──────────────────────────────
# def get_llm_client() -> LLMClient:
#     """获取 LLMClient 单例。Provider 由 LLM_PROVIDER 环境变量决定。"""
#     return create_llm_client()


def get_llm_service() -> LLMService:
    """组装 LLMService，注入 LLMClient。"""
    return LLMService(get_chat_model())


async def get_goal_service(
    session: AsyncSession = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service),
) -> GoalService:
    goal_repository = GoalRepository(session=session)
    return GoalService(session, repository=goal_repository, ai_service=llm_service)


async def get_lesson_service(
    session: AsyncSession = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service),
) -> LessonService:
    lesson_repository = LessonRepository(session=session)
    return LessonService(session, repository=lesson_repository, ai_service=llm_service)


def get_tool_registry(
    lesson_service: LessonService = Depends(get_lesson_service),
) -> ToolRegistry:
    """组装 Agent Tool 注册中心，注入请求级 LessonService。"""
    return build_lesson_tool_registry(lesson_service)


def get_goal_agent_service(
    db: AsyncSession = Depends(get_db),
    llm: LLMService = Depends(get_llm_service),
) -> GoalAgentService:
    session_repository = AgentSessionRepository(db=db)
    session_service = AgentSessionService(
        db=db,
        session_repository=session_repository,
    )

    return GoalAgentService(
        llm=llm,
        session=db,
        agent_session_service=session_service,
    )


def get_agent_registry(
    goal_agent: GoalAgentService = Depends(get_goal_agent_service),
) -> AgentRegistry:
    return build_agent_registry(goal_agent)


def get_orchestrator(
    db: AsyncSession = Depends(get_db),
    registry: AgentRegistry = Depends(get_agent_registry),
) -> Orchestrator:
    session_repository = AgentSessionRepository(db=db)
    session_service = AgentSessionService(db=db, session_repository=session_repository)
    return Orchestrator(
        decision_engine=LLMDecisionEngine(),
        dispatcher=AgentDispatcher(registry),
        policy=OrchestratorPolicy(registry),
        db=db,
        agent_session_service=session_service,
    )
