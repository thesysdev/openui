"""Converters: the same output as the TypeScript SDK's on the same input."""

from __future__ import annotations

import json
from collections.abc import Sequence
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.messages.utils import convert_to_messages
from support import GOLDEN

from openui_server import (
    ConversationItem,
    ConversationItemConverter,
    chat_completions_converter,
    langgraph_converter,
)

CASES = GOLDEN["converters"]

# The LangChain messages the TypeScript run used, as Python's own classes.
GRAPH_TURN = [
    SystemMessage("sys"),
    HumanMessage(
        [
            {"type": "text", "text": "hi"},
            {"type": "image_url", "image_url": {"url": "https://x/c.png", "detail": "low"}},
            {"type": "image_url", "image_url": "https://x/d.png"},
        ]
    ),
    AIMessage(
        "Calling",
        tool_calls=[
            {"id": "g1", "name": "get_sales", "args": {"region": "EU"}},
            {"id": "", "name": "skip", "args": {}},
        ],
    ),
    ToolMessage('{"rows":3}', tool_call_id="g1"),
    AIMessage([{"type": "text", "text": "All "}, {"type": "text", "text": "done"}]),
]


def test_chat_to_items_matches_typescript() -> None:
    assert chat_completions_converter.to_items(CASES["chat_turn"]) == CASES["chat_to_items"]


def test_chat_from_items_matches_typescript() -> None:
    assert chat_completions_converter.from_items(CASES["stored_items"]) == CASES["chat_from_items"]


def test_langgraph_to_items_matches_typescript() -> None:
    assert langgraph_converter.to_items(GRAPH_TURN) == CASES["langgraph_to_items"]


def test_langgraph_from_items_matches_typescript() -> None:
    assert langgraph_converter.from_items(CASES["stored_items"]) == CASES["langgraph_from_items"]


def test_chat_keeps_a_tool_call_only_with_its_result() -> None:
    turn = [
        {"role": "system", "content": "rules"},
        {"role": "user", "content": "go"},
        {
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {"id": "a", "type": "function", "function": {"name": "f", "arguments": ""}},
                {"id": "b", "type": "function", "function": {"name": "g", "arguments": "{}"}},
            ],
        },
        {"role": "tool", "tool_call_id": "a", "content": ""},
    ]
    assert chat_completions_converter.to_items(turn) == [
        {"type": "message", "role": "user", "content": [{"type": "input_text", "text": "go"}]},
        {"type": "function_call", "call_id": "a", "name": "f", "arguments": "{}"},
        {"type": "function_call_output", "call_id": "a", "output": "{}"},
    ]


def test_chat_from_items_puts_a_reply_and_its_calls_in_one_message() -> None:
    items = [
        {
            "id": "1",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "output_text", "text": "Let me look"}],
        },
        {"id": "2", "type": "function_call", "call_id": "a", "name": "f", "arguments": '{"x":1}'},
        {"id": "3", "type": "function_call_output", "call_id": "a", "output": {"ok": True}},
        {"id": "4", "type": "reasoning", "summary": []},
    ]
    assert chat_completions_converter.from_items(items) == [
        {
            "role": "assistant",
            "content": "Let me look",
            "tool_calls": [
                {"id": "a", "type": "function", "function": {"name": "f", "arguments": '{"x":1}'}}
            ],
        },
        {"role": "tool", "tool_call_id": "a", "content": '{"ok":true}'},
    ]


def test_langgraph_history_is_what_langgraph_takes() -> None:
    history = langgraph_converter.from_items(CASES["stored_items"] + _calls_and_result())
    messages = convert_to_messages(history)
    # "Done" and the call after it are one AI message, as in a model's reply.
    assert [type(m).__name__ for m in messages] == ["AIMessage", "ToolMessage"]
    assert (messages[0].content, messages[0].tool_calls[0]["args"]) == ("Done", {"q": 1})


def test_langgraph_to_items_pairs_calls_across_the_turn() -> None:
    # A result anywhere in the turn pairs with its call; a call with no result is dropped.
    turn = [
        AIMessage(
            "",
            tool_calls=[{"id": "a", "name": "f", "args": {}}, {"id": "b", "name": "g", "args": {}}],
        ),
        HumanMessage("meanwhile"),
        ToolMessage("done", tool_call_id="a"),
        ToolMessage("orphan", tool_call_id="z"),
    ]
    assert [item["type"] for item in langgraph_converter.to_items(turn)] == [
        "function_call",
        "message",
        "function_call_output",
    ]


def test_a_converter_for_another_sdk() -> None:
    class TextConverter(ConversationItemConverter[str, str]):
        def to_items(self, messages: Sequence[str]) -> list[dict[str, Any]]:
            return [{"type": "message", "role": "user", "content": m} for m in messages]

        def from_items(self, items: Sequence[ConversationItem]) -> list[str]:
            return [json.dumps(item["content"]) for item in items]

    converter = TextConverter()
    assert converter.from_items(converter.to_items(["hi"])) == ['"hi"']


def _calls_and_result() -> list[dict[str, Any]]:
    return [
        {
            "id": "x1",
            "type": "function_call",
            "call_id": "q",
            "name": "find",
            "arguments": '{"q":1}',
        },
        {"id": "x2", "type": "function_call_output", "call_id": "q", "output": "found"},
    ]
