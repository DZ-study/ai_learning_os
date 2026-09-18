"""端到端联调脚本：登录 -> 创建目标 -> 首条消息(SSE) -> 历史校验。

对本地运行的 uvicorn (127.0.0.1:8123) 发真实 HTTP 请求，
Redis 中直接写入验证码绕过邮件发送。
运行: .venv/Scripts/python e2e_home_to_space.py
"""

import json
import urllib.request

import redis

from app.core.config import settings

BASE = "http://127.0.0.1:8123"
EMAIL = "e2e_home_space@example.com"
CODE = "246810"
FIRST_MESSAGE = "我想在 3 个月内零基础学会 Python 数据分析"


def request(method: str, path: str, body: dict | None = None, token: str | None = None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    return req


def seed_code() -> None:
    client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    client.set(f"auth:code:{EMAIL}", CODE, ex=300)
    client.close()


def main() -> None:
    seed_code()

    with urllib.request.urlopen(
        request("POST", "/api/auth/login", {"email": EMAIL, "code": CODE})
    ) as resp:
        payload = json.load(resp)
    token = payload["data"]["access_token"]
    print("login OK")

    with urllib.request.urlopen(
        request(
            "POST",
            "/api/goals/create",
            {
                "title": FIRST_MESSAGE,
                "description": f"围绕“{FIRST_MESSAGE}”制定学习计划",
                "duration": 90,
                "priority": "medium",
            },
            token,
        )
    ) as resp:
        goal = json.load(resp)
    goal_id = goal["id"]
    print(f"create goal OK, goal_id={goal_id}, status={goal['status']}")

    with urllib.request.urlopen(
        request("GET", f"/api/goals/{goal_id}/agent/session", token=token)
    ) as resp:
        session = json.load(resp)
    print(f"initial session: {session}")
    assert session["session_id"] == 0

    events: list[tuple[str, dict]] = []
    event_type = "message"
    with urllib.request.urlopen(
        request(
            "POST",
            f"/api/goals/{goal_id}/agent/messages/stream",
            {"session_id": None, "message": FIRST_MESSAGE},
            token,
        )
    ) as resp:
        for raw in resp:
            line = raw.decode("utf-8").rstrip("\n")
            if not line:
                continue
            if line.startswith("event:"):
                event_type = line.split(":", 1)[1].strip()
            elif line.startswith("data:"):
                events.append((event_type, json.loads(line.split(":", 1)[1])))

    for et, data in events:
        print(f"  event={et} data={json.dumps(data, ensure_ascii=False)[:200]}")

    types = [t for t, _ in events]
    assert "error" not in types, "SSE returned error event"
    assert any(t in ("done", "plan_ready") for t in types), "no terminal event"

    with urllib.request.urlopen(
        request("GET", f"/api/goals/{goal_id}/agent/session", token=token)
    ) as resp:
        history = json.load(resp)
    messages = history["context"].get("messages", [])
    print(f"history: session_id={history['session_id']} stage={history['stage']}")
    for msg in messages:
        print(f"  [{msg['role']}] {msg['content'][:80]}")

    assert history["session_id"] != 0
    assert any(m["role"] == "user" for m in messages)
    assert any(m["role"] == "assistant" for m in messages)

    print("E2E OK")


if __name__ == "__main__":
    main()
