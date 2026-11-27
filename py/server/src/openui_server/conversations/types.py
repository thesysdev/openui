"""Conversations and their items (`conversations/types.ts`)."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    NotRequired,
    TypeAlias,
    TypedDict,
)

if TYPE_CHECKING:
    from langchain_core.messages import ToolCall
    from openai.types.responses import ResponseInputItemParam


ConversationItemStatus = Literal[
    "in_progress", "completed", "incomplete", "failed", "searching", "calling"
]


ConversationItem = dict[str, Any]
"""A stored item in OpenAI's Conversations API shape: narrow on `item["type"]`."""


ConversationItemInput: TypeAlias = "ResponseInputItemParam | Mapping[str, Any]"
"""An item to add, in OpenAI's shape: a `message`, `function_call` or `function_call_output`.
An item read back can be added as is."""


class LangGraphHumanMessage(TypedDict):
    role: Literal["human"]
    content: str | list[str | dict[str, Any]]


class LangGraphAIMessage(TypedDict):
    role: Literal["ai"]
    content: str
    tool_calls: NotRequired[list[ToolCall]]


class LangGraphToolMessage(TypedDict):
    role: Literal["tool"]
    content: str
    tool_call_id: str


LangGraphHistoryMessage: TypeAlias = (
    LangGraphHumanMessage | LangGraphAIMessage | LangGraphToolMessage
)
"""A stored message, as LangGraph takes it: pass these to `graph.invoke({"messages": ...})`,
whose `add_messages` reducer turns them into LangChain messages."""


@dataclass(frozen=True, slots=True)
class Conversation:
    """A saved conversation. Its messages and tool calls are its items."""

    id: str
    created_at: datetime
    title: str | None = None
    metadata: dict[str, str] | None = None
    user_id: str | None = None
    """The user it belongs to. None when your org made it without one."""
    app_id: str | None = None
