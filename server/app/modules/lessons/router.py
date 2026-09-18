from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_lesson_service
from app.modules.lessons.schemas import (
    LessonContentNotGenerated,
    LessonContentResponse,
)
from app.modules.lessons.service import LessonService

router = APIRouter(prefix="/lessons", tags=["Lessons"])


# 获取课时内容，未生成时返回正常业务状态
@router.get(
    "/{lesson_id}/content",
    response_model=LessonContentResponse | LessonContentNotGenerated,
)
async def get_lesson_content(
    lesson_id: int,
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user=Depends(get_current_user),
):
    return await lesson_service.get_content(
        lesson_id=lesson_id, user_id=current_user.id
    )


# 生成课时内容，已存在时直接返回已有内容
@router.post("/{lesson_id}/generate-content", response_model=LessonContentResponse)
async def generate_lesson_content(
    lesson_id: int,
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user=Depends(get_current_user),
):
    return await lesson_service.generate_content(
        lesson_id=lesson_id, user_id=current_user.id
    )
