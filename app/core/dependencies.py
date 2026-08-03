from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.email.client import EmailClient
from app.infrastructure.email.service import EmailService
from app.infrastructure.redis.client import redis_client
from app.infrastructure.redis.service import RedisService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
from app.modules.user.repository import UserRepository

from .database.session import get_db
from .security.jwt import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user_id(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return int(user_id)


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
