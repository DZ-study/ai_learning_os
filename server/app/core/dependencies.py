from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.ai.client import LLMClient, create_llm_client
from app.infrastructure.ai.service import LLMService
from app.infrastructure.email.client import EmailClient
from app.infrastructure.email.service import EmailService
from app.infrastructure.redis.client import redis_client
from app.infrastructure.redis.service import RedisService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
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
    return UserService(repository=user_repository)


# ── AI / LLM 依赖 ──────────────────────────────


def get_llm_client() -> LLMClient:
    """获取 LLMClient 单例。Provider 由 LLM_PROVIDER 环境变量决定。"""
    return create_llm_client()


def get_llm_service(
    llm: LLMClient = Depends(get_llm_client),
) -> LLMService:
    """组装 LLMService，注入 LLMClient。"""
    return LLMService(llm)
