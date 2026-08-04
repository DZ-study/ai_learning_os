from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# 创建异步数据库索引
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # 每条 SQL 语句都会打印出来，方便调试，生产环境应该关闭
)

# 创建异步数据库会话，所有数据库操作都在会话中进行
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


#  一个工厂函数 / 可调用对象，用来按需创建 AsyncSession 实例
async def get_db():
    async with SessionLocal() as session:
        yield session
