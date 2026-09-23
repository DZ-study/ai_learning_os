import asyncio
import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.core.dependencies import get_current_user, get_lesson_service, get_llm_service
from app.infrastructure.ai.service import LLMService
from app.modules.agents.workflow.tutor.schemas import (
    TutorMessage,
    TutorQuestionContext,
)
from app.modules.agents.workflow.tutor.worker import TutorWorker
from app.modules.lessons.repository import LessonRepository
from app.modules.lessons.schemas import (
    LessonContentNotGenerated,
    LessonContentResponse,
    LessonProgressResponse,
)
from app.modules.lessons.service import LessonService
from app.shared.exceptions import BadRequestException, NotFoundException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lessons", tags=["Lessons"])


class LessonTutorRequest(BaseModel):
    current_block_id: str | None = Field(default=None, max_length=64)
    messages: list[TutorMessage] = Field(default_factory=list, max_length=20)


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _lesson_tutor_stream(
    *,
    lesson_id: int,
    user_id: int,
    request: LessonTutorRequest,
    session: AsyncSession,
    llm_service: LLMService,
) -> AsyncIterator[str]:
    try:
        repository = LessonRepository(session)
        lesson = await repository.get_task(lesson_id, user_id)
        if lesson is None:
            raise NotFoundException("课时不存在或无权访问")

        content = await repository.get_content(lesson_id)
        block = None
        if request.current_block_id is not None:
            block = next(
                (
                    item
                    for item in (content.blocks if content else [])
                    if isinstance(item, dict)
                    and item.get("block_id") == request.current_block_id
                ),
                None,
            )
            if block is None:
                raise BadRequestException("当前学习内容块不属于该课时")

        goal = await repository.get_goal(lesson.goal_id)
        plan_item = (
            await repository.get_plan_item(lesson.plan_item_id)
            if lesson.plan_item_id
            else None
        )
        plan = await repository.get_active_plan(lesson.goal_id, user_id)
        user_message = next(
            (
                message.content
                for message in reversed(request.messages)
                if message.role == "user"
            ),
            None,
        )
        if not user_message:
            raise BadRequestException("请输入 Tutor 问题")

        context = TutorQuestionContext(
            goal={
                "id": goal.id if goal else lesson.goal_id,
                "title": goal.title if goal else "",
                "description": goal.description if goal else None,
                "duration": goal.duration if goal else None,
                "available_time": goal.available_time if goal else None,
            },
            lesson={
                "id": lesson.id,
                "title": lesson.title,
                "description": lesson.description,
                "estimated_minutes": lesson.estimated_minutes,
                "status": lesson.status,
                "plan_item_id": lesson.plan_item_id,
                "chapter": {
                    "id": plan_item.id if plan_item else None,
                    "title": plan_item.title if plan_item else "",
                    "objective": plan_item.objective if plan_item else "",
                },
                "plan": {
                    "id": plan.id if plan else None,
                    "version": plan.version if plan else None,
                    "summary": (plan.content or {}).get("summary") if plan else None,
                },
            },
            current_block=block,
            block_content=(
                block.get("content")
                if block
                else (content.blocks if content else None)
            ),
            recent_messages=request.messages,
            user_message=user_message,
        )

        worker = TutorWorker(llm_service)
        yield _sse_event(
            "status", {"stage": "tutoring", "message": "Tutor 正在回答..."}
        )
        async for chunk in worker.stream_question(context):
            if chunk:
                yield _sse_event("delta", {"content": chunk})
        yield _sse_event("done", {"stage": "tutoring"})
    except asyncio.CancelledError:
        raise
    except (BadRequestException, NotFoundException) as exc:
        yield _sse_event(
            "error", {"code": "TUTOR_REQUEST_INVALID", "message": exc.message}
        )
    except Exception:
        logger.exception("lesson tutor stream failed, lesson_id=%s", lesson_id)
        yield _sse_event(
            "error",
            {"code": "TUTOR_STREAM_FAILED", "message": "Tutor 回答失败，请稍后重试"},
        )


@router.post("/{lesson_id}/tutor/stream")
async def tutor_stream(
    lesson_id: int,
    request: LessonTutorRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service),
):
    return StreamingResponse(
        _lesson_tutor_stream(
            lesson_id=lesson_id,
            user_id=current_user.id,
            request=request,
            session=session,
            llm_service=llm_service,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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
