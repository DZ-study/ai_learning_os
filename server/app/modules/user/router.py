from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id, get_user_service
from app.modules.user.schemas import GetProfileResponse
from app.modules.user.service import UserService
from app.shared.schemas import ApiResponse

router = APIRouter(
    prefix="/users", tags=["users"], dependencies=Depends(get_current_user_id)
)


@router.get("/me", response_model=ApiResponse[GetProfileResponse])
async def getProfile(
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    profile = await user_service.get_profile(user_id)
    return ApiResponse(data=profile)
