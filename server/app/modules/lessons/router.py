from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_lesson_service
from app.modules.lessons.schemas import (
    LessonContentNotGenerated,
    LessonContentResponse,
    LessonProgressResponse,
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


@router.post("/{lesson_id}/start", response_model=LessonProgressResponse)
async def start_lesson(
    lesson_id: int,
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user=Depends(get_current_user),
):
    return await lesson_service.start_lesson(lesson_id, current_user.id)


@router.get("/{lesson_id}/progress", response_model=LessonProgressResponse)
async def get_lesson_progress(
    lesson_id: int,
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user=Depends(get_current_user),
):
    return await lesson_service.get_progress(lesson_id, current_user.id)


@router.post(
    "/{lesson_id}/blocks/{block_id}/complete",
    response_model=LessonProgressResponse,
)
async def complete_lesson_block(
    lesson_id: int,
    block_id: str,
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user=Depends(get_current_user),
):
    return await lesson_service.complete_block(lesson_id, current_user.id, block_id)
