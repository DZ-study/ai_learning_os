from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import settings


def _create_token(
    user_id: int,
    expires_delta: timedelta, # 过期时间
    token_type: str # token类型
) -> str:
    """
    创建JWT Token
    """

    now = datetime.now(UTC)

    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return token

def create_access_token(user_id: int) -> str:
    """
    创建访问令牌
    默认15分钟
    """
    return _create_token(
        user_id,
        expires_delta=timedelta(
            minutes=settings.JWT_ACCESS_EXPIRE
        ),
        token_type="access"
    )

def create_refresh_token(user_id: int) -> str:
    """
    创建刷新令牌
    默认30天
    """
    return _create_token(
        user_id,
        expires_delta=timedelta(
            days=settings.JWT_REFRESH_EXPIRE
        ),
        token_type="refresh"
    )

# 解析token
def decode_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[
                settings.JWT_ALGORITHM
            ]
        )

        return payload

    except jwt.InvalidTokenError:
        return None