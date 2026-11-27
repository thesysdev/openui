"""Chat Completions messages to conversation items and back (`openai/messages.ts`). Only `openai`'s
types are used, so the package is never imported at runtime: messages are plain dicts."""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from openai.types.chat import (
        ChatCompletionAssistantMessageParam,
        ChatCompletionContentPartParam,
        ChatCompletionMessageParam,
        ChatCompletionMessageToolCallParam,
    )
    from openai.types.responses import ResponseInputContentParam, ResponseInputItemParam
from ..conversations.types import ConversationItem
from ..core.http import json_text


def _user_content_of(content: Any) -> list[ResponseInputContentParam]:
    if isinstance(content, str):
        return [{"type": "input_text", "text": content}] if content else []
    parts: list[ResponseInputContentParam] = []
    for part in content or []:
        if part.get("type") == "text" and part.get("text"):
            parts.append({"type": "input_text", "text": part["text"]})
        elif part.get("type") == "image_url" and (part.get("image_url") or {}).get("url"):
            image = part["image_url"]
            parts.append(
                {
                    "type": "input_image",
                    "image_url": image["url"],
                    "detail": image.get("detail") or "auto",
                }
            )
    return parts


def _texts(parts: Iterable[Any], only_text_type: bool = False) -> str:
    return "".join(
        part.get("text") or ""
        for part in parts
        if isinstance(part, Mapping) and (not only_text_type or part.get("type") == "text")
    )


def _assistant_text_of(content: Any) -> str:
    if isinstance(content, str):
        return content
    return _texts(content, only_text_type=True) if isinstance(content, list) else ""


def _tool_output_of(content: Any) -> str:
    return content if isinstance(content, str) else _texts(content or [])


def _calls(message: ChatCompletionAssistantMessageParam) -> list[Mapping[str, Any]]:
    return [cast("Mapping[str, Any]", call) for call in message.get("tool_calls") or []]


def _paired_tool_calls(messages: Sequence[ChatCompletionMessageParam]) -> set[int]:
    """The tool calls and tool results to store, by identity: each is kept only with its pair, a
    result in the tool messages right after its call's assistant message. A run stopped mid tool
    call leaves calls without results, and model APIs reject every later request in a thread that
    has one."""
    paired: set[int] = set()
    for index, message in enumerate(messages):
        if message["role"] != "assistant":
            continue
        open_calls = {
            call["id"]: call
            for call in _calls(message)
            if call.get("type") == "function"
            and call.get("id")
            and (call.get("function") or {}).get("name")
        }
        for following in messages[index + 1 :]:
            if following["role"] != "tool":
                break
            call = open_calls.pop(following["tool_call_id"], None)
            if call is not None:
                paired.update((id(call), id(following)))
    return paired


def chat_messages_to_items(
    messages: Sequence[ChatCompletionMessageParam],
) -> list[ResponseInputItemParam]:
    """Breaks Chat Completions messages into Conversations API items. Pass the new turn, not the
    full replay, or items will be duplicated. System and developer messages are skipped
    (instructions, not history), and so are tool calls without a result and results without a
    call."""
    items: list[ResponseInputItemParam] = []
    paired = _paired_tool_calls(messages)

    for message in messages:
        if message["role"] == "user":
            content = _user_content_of(message["content"])
            if content:
                items.append({"type": "message", "role": "user", "content": content})
        elif message["role"] == "assistant":
            text = _assistant_text_of(message.get("content"))
            if text:
                # OpenAI's input types have no short assistant message; Conversations takes it.
                assistant: dict[str, Any] = {
                    "type": "message",
                    "role": "assistant",
                    "content": [{"type": "output_text", "text": text}],
                }
                items.append(cast("ResponseInputItemParam", assistant))
            for call in _calls(message):
                if call.get("type") != "function" or id(call) not in paired:
                    continue
                arguments = call["function"].get("arguments")
                items.append(
                    {
                        "type": "function_call",
                        "call_id": call["id"],
                        "name": call["function"]["name"],
                        "arguments": arguments if arguments and arguments.strip() else "{}",
                    }
                )
        elif message["role"] == "tool" and id(message) in paired:
            items.append(
                {
                    "type": "function_call_output",
                    "call_id": message["tool_call_id"],
                    "output": _tool_output_of(message["content"]) or "{}",
                }
            )
    return items


def _text_of(part: Any) -> str:
    text = part.get("text") if isinstance(part, Mapping) else None
    return text if isinstance(text, str) else ""


def _user_message_content(content: Any) -> str | list[ChatCompletionContentPartParam]:
    """A user message's content: plain text, or parts when it has an image."""
    if isinstance(content, str):
        return content
    if not any(part.get("type") == "input_image" for part in content):
        return "".join(_text_of(part) for part in content)

    parts: list[ChatCompletionContentPartParam] = []
    for part in content:
        if part.get("type") == "input_image" and isinstance(part.get("image_url"), str):
            detail = part.get("detail")
            if detail in ("low", "high", "auto"):
                parts.append(
                    {"type": "image_url", "image_url": {"url": part["image_url"], "detail": detail}}
                )
            else:
                parts.append({"type": "image_url", "image_url": {"url": part["image_url"]}})
        elif _text_of(part):
            parts.append({"type": "text", "text": _text_of(part)})
    return parts


def _tool_output_text(output: Any) -> str:
    if isinstance(output, str):
        return output
    if isinstance(output, list):
        return "".join(_text_of(part) for part in output)
    return json_text(output if output is not None else "")


def items_to_chat_messages(items: Sequence[ConversationItem]) -> list[ChatCompletionMessageParam]:
    """Stored items back to Chat Completions messages, oldest first: the reverse of
    `chat_messages_to_items()`. A tool call and its result are kept only together, since Chat
    Completions rejects either alone; other item types, such as `reasoning`, are skipped."""
    called = {item.get("call_id") for item in items if item.get("type") == "function_call"}
    answered = {item.get("call_id") for item in items if item.get("type") == "function_call_output"}

    messages: list[ChatCompletionMessageParam] = []
    # The latest message, when it's the assistant's: a reply's text and its tool calls are one.
    reply: ChatCompletionAssistantMessageParam | None = None
    for item in items:
        kind = item.get("type")
        if kind == "message":
            content = item.get("content") or ""
            if item.get("role") == "user":
                user_content = _user_message_content(content)
                if user_content:
                    messages.append({"role": "user", "content": user_content})
                    reply = None
            elif item.get("role") == "assistant":
                text = content if isinstance(content, str) else _texts(content)
                if text:
                    reply = {"role": "assistant", "content": text}
                    messages.append(reply)
        elif kind == "function_call" and item.get("call_id") in answered:
            call: ChatCompletionMessageToolCallParam = {
                "id": item["call_id"],
                "type": "function",
                "function": {
                    "name": item.get("name") or "",
                    "arguments": item.get("arguments") or "",
                },
            }
            if reply is None:
                reply = {"role": "assistant", "content": None, "tool_calls": []}
                messages.append(reply)
            reply.setdefault("tool_calls", [])
            cast("list[ChatCompletionMessageToolCallParam]", reply["tool_calls"]).append(call)
        elif kind == "function_call_output" and item.get("call_id") in called:
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": item["call_id"],
                    "content": _tool_output_text(item.get("output")),
                }
            )
            reply = None
    return messages
