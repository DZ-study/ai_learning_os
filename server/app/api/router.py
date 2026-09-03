from fastapi import APIRouter

from app.modules.agent.router import router as agent_router
from app.modules.auth.router import router as auth_router
from app.modules.goals.router import router as goals_router
from app.modules.user.router import router as user_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(agent_router)
api_router.include_router(goals_router)
