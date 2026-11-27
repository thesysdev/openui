"""LangGraph's LangChain messages to Chat Completions messages and back (`langgraph/messages.ts`).
Messages are told apart by `message.type`, so `langchain_core` is only used for its types."""

from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from langchain_core.messages import BaseMessage, ToolCall
    from openai.types.chat import (
        ChatCompletionContentPartParam,
        ChatCompletionMessageParam,
        ChatCompletionMessageToolCallParam,
    )
    from openai.types.responses import ResponseInputItemParam

from ..conversations.converter import ConversationItemConverter
from ..conversations.types import (
    ConversationItem,
    LangGraphAIMessage,
    LangGraphHistoryMessage,
    LangGraphHumanMessage,
)
from ..core.http import json_text
from ..openai.messages import chat_completions_converter

# Python's merged stream chunks keep their own type name.
_AI_TYPES = ("ai", "AIMessageChunk")


# LangChain's text/image_url content blocks use the Chat Completions shape. A bare string in the
# list is text, as LangChain's Python messages allow.
def _user_content_of(content: Any) -> str | list[ChatCompletionContentPartParam]:
    if isinstance(content, str):
        return content
    parts: list[ChatCompletionContentPartParam] = []
    for block in content or []:
        if isinstance(block, str):
            parts.append({"type": "text", "text": block})
        elif not isinstance(block, Mapping):
            continue
        elif block.get("type") == "text" and isinstance(block.get("text"), str):
            parts.append({"type": "text", "text": block["text"]})
        elif block.get("type") == "image_url":
            image = block.get("image_url")
            if isinstance(image, str):
                parts.append({"type": "image_url", "image_url": {"url": image}})
            elif isinstance(image, Mapping) and isinstance(image.get("url"), str):
                detail = image.get("detail")
                parts.append(
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image["url"],
                            "detail": detail if detail in ("low", "high") else "auto",
                        },
                    }
                )
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


def _tool_calls_of(message: BaseMessage) -> list[ChatCompletionMessageToolCallParam]:
    calls: list[ToolCall] = getattr(message, "tool_calls", None) or []
    result: list[ChatCompletionMessageToolCallParam] = []
    for call in calls:
        id, name, args = call.get("id"), call.get("name"), call.get("args")
        if id and name:
            arguments = args if isinstance(args, str) else json_text(args or {})
            result.append(
                {"type": "function", "id": id, "function": {"name": name, "arguments": arguments}}
            )
    return result


def langgraph_to_chat_messages(
    messages: Sequence[BaseMessage],
) -> list[ChatCompletionMessageParam]:
    """A LangGraph turn as Chat Completions messages. System messages are instructions, not
    history."""
    result: list[ChatCompletionMessageParam] = []
    for message in messages:
        if message.type == "human":
            result.append({"role": "user", "content": _user_content_of(message.content)})
        elif message.type in _AI_TYPES:
            result.append(
                {
                    "role": "assistant",
                    "content": _text_of(message.content),
                    "tool_calls": _tool_calls_of(message),
                }
            )
        elif message.type == "tool" and getattr(message, "tool_call_id", None):
            result.append(
                {
                    "role": "tool",
                    "tool_call_id": getattr(message, "tool_call_id"),  # noqa: B009
                    "content": _text_of(message.content),
                }
            )
    return result


def _args_of(arguments: Any) -> dict[str, Any]:
    try:
        args = json.loads(arguments)
    except (TypeError, ValueError):
        return {}
    return args if isinstance(args, dict) else {}


def chat_to_langgraph_messages(
    messages: Sequence[ChatCompletionMessageParam],
) -> list[LangGraphHistoryMessage]:
    """Chat Completions messages as LangGraph takes them: plain `{"role", "content"}` dicts,
    which its `add_messages` reducer turns into LangChain messages."""
    result: list[LangGraphHistoryMessage] = []
    for message in messages:
        if message["role"] == "user":
            parts = message["content"]
            # LangChain's text and image_url blocks are Chat Completions' parts.
            human: LangGraphHumanMessage = {
                "role": "human",
                "content": parts if isinstance(parts, str) else cast("Any", list(parts)),
            }
            result.append(human)
        elif message["role"] == "assistant":
            content = message.get("content")
            ai: LangGraphAIMessage = {
                "role": "ai",
                "content": content if isinstance(content, str) else "",
            }
            tool_calls: list[ToolCall] = []
            for call in message.get("tool_calls") or []:
                if call["type"] == "function":
                    function = call["function"]
                    args = _args_of(function.get("arguments"))
                    tool_calls.append(
                        {
                            "type": "tool_call",
                            "id": call["id"],
                            "name": function["name"],
                            "args": args,
                        }
                    )
            if tool_calls:
                ai["tool_calls"] = tool_calls
            result.append(ai)
        elif message["role"] == "tool":
            content = message["content"]
            result.append(
                {
                    "role": "tool",
                    "content": content if isinstance(content, str) else "",
                    "tool_call_id": message["tool_call_id"],
                }
            )
    return result


class LangGraphConverter(ConversationItemConverter["BaseMessage", "LangGraphHistoryMessage"]):
    """LangGraph's LangChain messages to conversation items, through Chat Completions, and back
    as plain messages `graph.invoke` takes."""

    def to_items(self, messages: Sequence[BaseMessage]) -> list[ResponseInputItemParam]:
        return chat_completions_converter.to_items(self.to_chat_messages(messages))

    def from_items(self, items: Sequence[ConversationItem]) -> list[LangGraphHistoryMessage]:
        return self.from_chat_messages(chat_completions_converter.from_items(items))

    def to_chat_messages(self, messages: Sequence[BaseMessage]) -> list[ChatCompletionMessageParam]:
        """A LangGraph turn as Chat Completions messages."""
        return langgraph_to_chat_messages(messages)

    def from_chat_messages(
        self, messages: Sequence[ChatCompletionMessageParam]
    ) -> list[LangGraphHistoryMessage]:
        """Chat Completions messages as LangGraph takes them."""
        return chat_to_langgraph_messages(messages)


langgraph_converter = LangGraphConverter()
"""LangChain messages to conversation items and back: `openui.langgraph.conversations` uses it."""
