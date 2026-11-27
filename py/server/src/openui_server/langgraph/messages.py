"""LangGraph's LangChain messages to conversation items and back (`langgraph/messages.ts`).
Messages are told apart by `message.type`, so `langchain_core` is only used for its types."""

from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from typing import TYPE_CHECKING, Any, cast

from ..conversations.converter import (
    ConversationItemConverter,
    paired_call_ids,
    text_of,
    tool_output_text,
)
from ..conversations.types import ConversationItem, LangGraphAIMessage, LangGraphHistoryMessage
from ..core.http import json_text

if TYPE_CHECKING:
    from langchain_core.messages import BaseMessage, ToolCall
    from openai.types.responses import ResponseInputContentParam, ResponseInputItemParam

# Python's merged stream chunks keep their own type name.
_AI_TYPES = ("ai", "AIMessageChunk")


def _detail_of(detail: Any) -> str:
    return detail if detail in ("low", "high") else "auto"


def _image_url_of(image: Any) -> Any:
    return (
        image
        if isinstance(image, str)
        else image.get("url")
        if isinstance(image, Mapping)
        else None
    )


def _input_parts_of(content: Any) -> list[ResponseInputContentParam]:
    """A human message's text and image blocks as input parts. A bare string in the list is
    text, as LangChain's Python messages allow."""
    if isinstance(content, str):
        return [{"type": "input_text", "text": content}] if content else []
    parts: list[ResponseInputContentParam] = []
    for block in content or []:
        if isinstance(block, str):
            if block:
                parts.append({"type": "input_text", "text": block})
        elif not isinstance(block, Mapping):
            continue
        elif block.get("type") == "text" and isinstance(block.get("text"), str) and block["text"]:
            parts.append({"type": "input_text", "text": block["text"]})
        elif block.get("type") == "image_url":
            image = block.get("image_url")
            url = _image_url_of(image)
            if not isinstance(url, str) or not url:
                continue
            detail = _detail_of(image.get("detail") if isinstance(image, Mapping) else None)
            part = {"type": "input_image", "image_url": url, "detail": detail}
            parts.append(cast("ResponseInputContentParam", part))
    return parts


# Read from `content`, not `.text`: langchain-core 1.x turned the `text()` method into a property.
def _text_of(content: Any) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    texts = [
        block
        if isinstance(block, str)
        else block.get("text") or ""
        if isinstance(block, Mapping) and block.get("type") == "text"
        else ""
        for block in content
    ]
    return "".join(texts)


def _human_content_of(content: Any) -> str | list[str | dict[str, Any]]:
    """A stored user message as LangChain content: text, or blocks when it has an image."""
    if isinstance(content, str):
        return content
    if not any(part.get("type") == "input_image" for part in content):
        return "".join(text_of(part) for part in content)
    blocks: list[str | dict[str, Any]] = []
    for part in content:
        if part.get("type") == "input_image" and isinstance(part.get("image_url"), str):
            image: dict[str, Any] = {"url": part["image_url"]}
            if part.get("detail") in ("low", "high", "auto"):
                image["detail"] = part["detail"]
            blocks.append({"type": "image_url", "image_url": image})
        elif text_of(part):
            blocks.append({"type": "text", "text": text_of(part)})
    return blocks


def _args_of(arguments: Any) -> dict[str, Any]:
    try:
        args = json.loads(arguments)
    except (TypeError, ValueError):
        return {}
    return args if isinstance(args, dict) else {}


def _tool_calls_of(message: BaseMessage) -> list[ToolCall]:
    calls: list[ToolCall] = getattr(message, "tool_calls", None) or []
    return [call for call in calls if call.get("id") and call.get("name")]


class LangGraphConverter(ConversationItemConverter["BaseMessage", "LangGraphHistoryMessage"]):
    """LangChain messages to conversation items, and back as plain messages `graph.invoke`
    takes."""

    def to_items(self, messages: Sequence[BaseMessage]) -> list[ResponseInputItemParam]:
        """LangChain messages as Conversations API items. Pass only the new turn. Skips system
        messages, and tool calls or results without their pair."""
        calls: set[str] = set()
        results: set[str] = set()
        for message in messages:
            if message.type in _AI_TYPES:
                calls.update(str(call["id"]) for call in _tool_calls_of(message))
            elif message.type == "tool" and getattr(message, "tool_call_id", None):
                results.add(getattr(message, "tool_call_id"))  # noqa: B009

        items: list[ResponseInputItemParam] = []
        for message in messages:
            if message.type == "human":
                content = _input_parts_of(message.content)
                if content:
                    items.append({"type": "message", "role": "user", "content": content})
            elif message.type in _AI_TYPES:
                text = _text_of(message.content)
                if text:
                    # OpenAI's input types have no short assistant message; Conversations takes it.
                    assistant: dict[str, Any] = {
                        "type": "message",
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": text}],
                    }
                    items.append(cast("ResponseInputItemParam", assistant))
                for call in _tool_calls_of(message):
                    if call["id"] not in results:
                        continue
                    args = call.get("args")
                    items.append(
                        {
                            "type": "function_call",
                            "call_id": str(call["id"]),
                            "name": call["name"],
                            "arguments": args if isinstance(args, str) else json_text(args or {}),
                        }
                    )
            elif message.type == "tool" and getattr(message, "tool_call_id", None) in calls:
                items.append(
                    {
                        "type": "function_call_output",
                        "call_id": getattr(message, "tool_call_id"),  # noqa: B009
                        "output": _text_of(message.content) or "{}",
                    }
                )
        return items

    def from_items(self, items: Sequence[ConversationItem]) -> list[LangGraphHistoryMessage]:
        """Stored items as plain `{"role", "content"}` messages that `graph.invoke` takes. Keeps a
        tool call only with its result; skips other types, such as `reasoning`."""
        paired = paired_call_ids(items)
        messages: list[LangGraphHistoryMessage] = []
        # The latest message, when it's an AI one: a reply's text and its tool calls are one.
        reply: LangGraphAIMessage | None = None
        for item in items:
            kind, content = item.get("type"), item.get("content") or ""
            if kind == "message" and item.get("role") == "user":
                human = _human_content_of(content)
                if human:
                    messages.append({"role": "human", "content": human})
                    reply = None
            elif kind == "message" and item.get("role") == "assistant":
                text = content if isinstance(content, str) else "".join(map(text_of, content))
                if text:
                    reply = {"role": "ai", "content": text}
                    messages.append(reply)
            elif kind == "function_call" and item.get("call_id") in paired:
                call: ToolCall = {
                    "type": "tool_call",
                    "id": item["call_id"],
                    "name": item.get("name") or "",
                    "args": _args_of(item.get("arguments")),
                }
                if reply is None:
                    reply = {"role": "ai", "content": "", "tool_calls": []}
                    messages.append(reply)
                reply.setdefault("tool_calls", []).append(call)
            elif kind == "function_call_output" and item.get("call_id") in paired:
                messages.append(
                    {
                        "role": "tool",
                        "content": tool_output_text(item.get("output")),
                        "tool_call_id": item["call_id"],
                    }
                )
                reply = None
        return messages


langgraph_converter = LangGraphConverter()
"""LangChain messages to conversation items and back: `openui.langgraph.conversations` uses it."""
