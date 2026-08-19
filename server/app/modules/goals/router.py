from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user, get_goal_service
from app.modules.goals.schemas import (
    GoalCreate,
    GoalParseRequest,
    GoalParseResponse,
    GoalResponse,
)
from app.modules.goals.service import GoalService

router = APIRouter(prefix="/goals", tags=["Goals"])


# 获取目标列表
@router.get("/list", response_model=list[GoalResponse])
async def get_goals(
    goal_service: GoalService = Depends(get_goal_service),
    current_user=Depends(get_current_user),
):
    return await goal_service.get_goals(user_id=current_user.id)


# 创建目标
@router.post(
    "/create", response_model=GoalResponse, status_code=status.HTTP_201_CREATED
)
async def create_goal(
    data: GoalCreate,
    current_user=Depends(get_current_user),
    goal_service: GoalService = Depends(get_goal_service),
):
    return await goal_service.create_goal(user_id=current_user.id, data=data)


# @router.post("/parse", response_model=GoalParseResponse)
# async def parse_goal(
#     request: GoalParseRequest, goal_service: GoalService = Depends(get_goal_service)
# ):
#     return await goal_service.parse_goal(request.messages)

# # 获取目标详情
# @router.get("/{goal_id}", response_model=GoalResponse)
# async def get_goal(goal_id: int, current_user=Depends(get_current_user)):
#     return await goal_service.get_goal(goal_id=goal_id, user_id=current_user.id)


# # 修改目标
# @router.put("/{goal_id}", response_model=GoalResponse)
# async def update_goal(
#     goal_id: int, data: GoalUpdate, current_user=Depends(get_current_user)
# ):
#     return await goal_service.update_goal(
#         goal_id=goal_id, user_id=current_user.id, data=data
#     )


# # 删除目标
# @router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_goal(goal_id: int, current_user=Depends(get_current_user)):
#     await goal_service.delete_goal(goal_id=goal_id, user_id=current_user.id)
