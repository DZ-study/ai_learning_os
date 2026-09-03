from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id, get_user_service
from app.modules.user.schemas import GetProfileResponse, UpdateProfileRequest
from app.modules.user.service import UserService
from app.shared.schemas import ApiResponse

router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(get_current_user_id)]
)


@router.get("/me", response_model=ApiResponse[GetProfileResponse])
async def getProfile(
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    profile = await user_service.get_profile(user_id)
    return ApiResponse(data=profile)


@router.patch("/me", response_model=ApiResponse[UpdateProfileRequest])
async def updateProfile(
    profile_data: UpdateProfileRequest,
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    updated_profile = await user_service.update_profile(user_id, profile_data)
    return ApiResponse(data=updated_profile)
