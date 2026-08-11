"""LLM 响应解析工具。

纯函数，无外部依赖。将 LLM 返回的文本解析为结构化数据。
"""

import json
import re


def extract_json(text: str) -> dict | list:
    """从 LLM 响应文本中提取 JSON。

    兼容 LLM 返回的多种格式：
    - 纯 JSON: {"key": "value"}
    - markdown 代码块: ```json ... ```
    - 带前后文字说明

    Raises:
        ValueError: 无法提取有效 JSON
    """
    # 尝试匹配 ```json ... ``` 代码块
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    # 尝试匹配第一个 { } 或 [ ] 包围的内容
    trimmed = text.strip()
    if trimmed.startswith("{") or trimmed.startswith("["):
        # 找到最外层闭合括号
        return json.loads(trimmed)

    # 最后尝试整个文本
    return json.loads(text)


def parse_bool(text: str) -> bool:
    """从 LLM 响应中提取布尔值。兼容 Yes/No、True/False 等变体。"""
    cleaned = text.strip().lower().rstrip(".")
    if cleaned in ("yes", "true", "是", "y", "1"):
        return True
    if cleaned in ("no", "false", "否", "n", "0"):
        return False
    raise ValueError(f"无法解析为布尔值: {text!r}")
