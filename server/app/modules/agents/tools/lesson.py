"""Lesson 能力工具。

封装 LessonService，供 Global Controller / Tutor Agent 调用。
不直接操作数据库，不包含 LLM 调用逻辑（生成逻辑在 LessonService 内）。
"""

from pydantic import BaseModel

from app.modules.agents.tools.base import ToolResult
from app.modules.lessons.service import LessonService
from app.shared.exceptions import AppException


class _LessonTool:
    name: str
    description: str

    def __init__(self, lesson_service: LessonService) -> None:
        self._lesson_service = lesson_service

    @staticmethod
    def _ok(data: BaseModel) -> ToolResult:
        return ToolResult(ok=True, data=data.model_dump(mode="json"))

    @staticmethod
    def _fail(exc: AppException) -> ToolResult:
        return ToolResult(ok=False, error=exc.message)


class GetLessonInfoTool(_LessonTool):
    """查询课时信息（标题、描述、预计时长、学习状态等）。"""

    name = "get_lesson_info"
    description = "查询课时信息：标题、描述、预计时长、学习状态"

    async def run(self, *, lesson_id: int, user_id: int) -> ToolResult:
        try:
            info = await self._lesson_service.get_lesson_info(lesson_id, user_id)
        except AppException as exc:
            return self._fail(exc)
        return self._ok(info)


class GetLessonContentTool(_LessonTool):
    """获取课时学习内容，未生成时返回 not_generated 状态。"""

    name = "get_lesson_content"
    description = "获取课时学习内容；未生成时返回 status=not_generated"

    async def run(self, *, lesson_id: int, user_id: int) -> ToolResult:
        try:
            content = await self._lesson_service.get_content(lesson_id, user_id)
        except AppException as exc:
            return self._fail(exc)
        return self._ok(content)


class GenerateLessonContentTool(_LessonTool):
    """生成课时学习内容（幂等，已存在时直接返回）。"""

    name = "generate_lesson_content"
    description = "调用 LLM 生成课时学习内容并保存；已生成时直接返回已有内容"

    async def run(self, *, lesson_id: int, user_id: int) -> ToolResult:
        try:
            content = await self._lesson_service.generate_content(lesson_id, user_id)
        except AppException as exc:
            return self._fail(exc)
        return self._ok(content)


class UpdateLessonStatusTool(_LessonTool):
    """更新课时学习状态（not_started / in_progress / completed）。"""

    name = "update_lesson_status"
    description = "更新课时学习状态：not_started / in_progress / completed"

    async def run(self, *, lesson_id: int, user_id: int, status: str) -> ToolResult:
        try:
            info = await self._lesson_service.update_lesson_status(
                lesson_id, user_id, status
            )
        except AppException as exc:
            return self._fail(exc)
        return self._ok(info)
