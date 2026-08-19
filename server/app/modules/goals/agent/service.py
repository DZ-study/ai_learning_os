import json
import logging
from collections.abc import AsyncIterator
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.ai.service import LLMService
from app.modules.goals.models import GoalAgentSession, Goals

logger = logging.getLogger(__name__)


class GoalAgentService:
    def __init__(self, session: AsyncSession, llm: LLMService) -> None:
        self.session, self.llm = session, llm

    async def start(self, goal_id: int, user_id: int):
        goal = await self.session.get(Goals, goal_id)
        if not goal or goal.user_id != user_id:
            raise ValueError("目标不存在或无权访问")
        state = GoalAgentSession(
            id=str(uuid4()),
            goal_id=goal_id,
            user_id=user_id,
            stage="collecting_info",
            context={"messages": []},
            last_question="请告诉我你目前的基础和学习目标，例如当前水平、已有经验？",
            # goal_agent_sessions.expires_at 当前迁移为 TIMESTAMP WITHOUT TIME ZONE；
            # 统一保存 naive UTC，避免 asyncpg 将 aware datetime 绑定到无时区列时报错。
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        self.session.add(state)
        await self.session.commit()
        return {
            "session_id": state.id,
            "stage": state.stage,
            "message": "为了制定更适合你的计划，我需要了解一些信息。",
            "question": state.last_question,
        }

    async def message_stream(
        self, goal_id: int, user_id: int, request
    ) -> AsyncIterator[str]:
        result = await self.session.execute(
            select(GoalAgentSession).where(
                GoalAgentSession.id == request.session_id,
                GoalAgentSession.goal_id == goal_id,
                GoalAgentSession.user_id == user_id,
            )
        )
        state, goal = (
            result.scalar_one_or_none(),
            await self.session.get(Goals, goal_id),
        )
        if not state or not goal:
            yield self._event("error", {"message": "Agent 会话不存在"})
            return
        state.context.setdefault("messages", []).append(
            {"role": "user", "content": request.message}
        )
        yield self._event(
            "status", {"stage": state.stage, "message": "正在分析你的回答…"}
        )
        try:
            extracted = await self._extract_profile(goal, state, request.message)
        except Exception as exc:
            logger.exception("goal agent profile extraction failed session=%s", state.id)
            await self.session.rollback()
            yield self._event("error", {"message": "分析回答失败，请稍后重试"})
            return
        state.context = {
            **state.context,
            **{k: v for k, v in extracted.items() if v not in (None, "", [])},
        }
        missing = self._missing(goal, state)
        if missing:
            question = self._question(missing[0])
            state.last_question = question
            state.context = {
                **state.context,
                "messages": [
                    *state.context.get("messages", []),
                    {"role": "assistant", "content": question},
                ],
            }
            await self.session.commit()
            try:
                async for chunk in self.llm.chat_stream(
                    question,
                    system_prompt="你是学习目标规划助手。只输出简短友好的追问，不要输出内部推理。",
                ):
                    yield self._event("delta", {"content": chunk})
            except Exception as exc:
                logger.exception("goal agent question stream failed session=%s", state.id)
                await self.session.rollback()
                yield self._event("error", {"message": "生成追问失败，请稍后重试"})
                return
            yield self._event(
                "done", {"stage": "collecting_info", "session_id": state.id}
            )
            return
        state.stage = "generating_plan"
        await self.session.flush()
        yield self._event(
            "status", {"stage": state.stage, "message": "信息已足够，正在生成学习计划…"}
        )
        content = ""
        try:
            async for chunk in self.llm.chat_stream(
                self._plan_prompt(goal, state), system_prompt=self._plan_system_prompt()
            ):
                content += chunk
                yield self._event("delta", {"content": chunk})
        except Exception as exc:
            logger.exception("goal agent plan stream failed session=%s", state.id)
            await self.session.rollback()
            yield self._event("error", {"message": "生成计划失败，请稍后重试"})
            return
        try:
            plan = self._parse_json(content)
        except (ValueError, json.JSONDecodeError):
            state.stage = "collecting_info"
            await self.session.commit()
            yield self._event("error", {"message": "计划格式解析失败，请重试"})
            return
        state.pending_plan, state.stage = plan, "awaiting_plan_confirmation"
        state.context = {
            **state.context,
            "messages": [
                *state.context.get("messages", []),
                {"role": "assistant", "content": content},
            ],
        }
        await self.session.commit()
        yield self._event(
            "plan_ready",
            {
                "stage": state.stage,
                "session_id": state.id,
                "plan": jsonable_encoder(plan),
            },
        )

    async def _extract_profile(self, goal, state, answer: str) -> dict:
        prompt = (
            "从用户回答中提取学习规划信息，只返回 JSON。字段可选：current_level, daily_minutes, learning_preference, constraints。\n"
            f"目标：{goal.title}；已有信息：{json.dumps(state.context, ensure_ascii=False)}\n用户回答：{answer}"
        )
        response = await self.llm.chat(
            prompt,
            system_prompt="你是结构化信息抽取器，只返回合法 JSON。",
            temperature=0,
        )
        try:
            return self._parse_json(response.content)
        except (ValueError, json.JSONDecodeError):
            return {}

    @staticmethod
    def _missing(goal, state):
        missing = []
        if not state.context.get("current_level"):
            missing.append("current_level")
        if not goal.available_time and not state.context.get("daily_minutes"):
            missing.append("daily_minutes")
        if not state.context.get("learning_preference"):
            missing.append("learning_preference")
        return missing

    @staticmethod
    def _question(field):
        return {
            "current_level": "你目前在这个目标上是什么水平？例如：零基础、了解基础、可以完成简单项目。",
            "daily_minutes": "你平时每天大约能投入多少时间学习？",
            "learning_preference": "你更偏好视频、文章、项目实践、刷题，还是混合学习？",
        }[field]

    @staticmethod
    def _plan_prompt(goal, state):
        return f"目标：{goal.title}\n描述：{goal.description}\n周期：{goal.duration}天\n用户信息：{json.dumps(state.context, ensure_ascii=False)}"

    @staticmethod
    def _plan_system_prompt():
        return '你是学习规划助手。只返回合法 JSON，不要 Markdown 或解释。格式：{"summary":"","milestones":[{"title":"","objective":"","tasks":[{"title":"","description":"","estimated_minutes":30}]}]}。不要输出内部推理，任务必须具体可执行。'

    @staticmethod
    def _parse_json(content: str):
        start, end = content.find("{"), content.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("invalid json")
        return json.loads(content[start : end + 1])

    @staticmethod
    def _event(event_type: str, data: dict) -> str:
        return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
