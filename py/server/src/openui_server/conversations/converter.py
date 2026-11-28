"""Converters between one SDK's messages and conversation items (`conversations/converter.ts`)."""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from collections.abc import Mapping, Sequence
from typing import Any, Generic, TypeVar

from .types import ConversationItem, ConversationItemInput

In = TypeVar("In")
Out = TypeVar("Out")


class ConversationItemConverter(ABC, Generic[In, Out]):
    """Turns one SDK's messages into conversation items, and stored items back into them.
    Subclass it for another SDK; `chat_completions_converter` and `langgraph_converter` are the
    built-in ones."""

    @abstractmethod
    def to_items(self, messages: Sequence[In]) -> Sequence[ConversationItemInput]:
        """A new turn as items to store."""

    @abstractmethod
    def from_items(self, items: Sequence[ConversationItem]) -> list[Out]:
        """Stored items, oldest first, as messages for the model."""


def text_of(part: Any) -> str:
    """A content part's text, or ""."""
    text = part.get("text") if isinstance(part, Mapping) else None
    return text if isinstance(text, str) else ""


def tool_output_text(output: Any) -> str:
    """A tool result's output as text."""
    if isinstance(output, str):
        return output
    if isinstance(output, list):
        return "".join(text_of(part) for part in output)
    return json.dumps(
        output if output is not None else "", separators=(",", ":"), ensure_ascii=False
    )


def paired_call_ids(items: Sequence[Mapping[str, Any]]) -> set[str]:
    """Call ids stored with both their call and its result: models reject either one alone."""
    calls = {item.get("call_id") for item in items if item.get("type") == "function_call"}
    results = {item.get("call_id") for item in items if item.get("type") == "function_call_output"}
    return {id for id in calls & results if isinstance(id, str)}
