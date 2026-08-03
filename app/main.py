from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.database.base import Base
from app.core.database.session import engine
from app.shared.exceptions import AppException
from app.shared.schemas import ApiResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时尝试建表（作为安全兜底，正式的迁移由 alembic 管理）
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# ── 全局异常处理器 ──────────────────────────────
# 捕获所有 AppException 子类，按业务约定的格式返回给前端


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            code=exc.code,
            message=exc.message,
            data=exc.data,
        ).dict(),
    )


app.include_router(
    api_router,
    prefix="/api",
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "AI Learning OS API running",
    }
