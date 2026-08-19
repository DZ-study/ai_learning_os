import logging
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# 创建异步数据库索引
logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.SQL_ECHO,
)

# 创建异步数据库会话，所有数据库操作都在会话中进行
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


#  一个工厂函数 / 可调用对象，用来按需创建 AsyncSession 实例
async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            logger.exception("Database transaction rolled back because the request failed")
            raise
