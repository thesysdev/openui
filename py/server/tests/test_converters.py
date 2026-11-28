"""The converters behind `openui.chat` and `openui.langgraph`: the same output as the
TypeScript SDK's on the same input."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.messages.utils import convert_to_messages
from support import GOLDEN

from openui_server.langgraph.messages import langgraph_converter
from openui_server.openai.messages import chat_completions_converter

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


def test_langgraph_stores_its_plain_messages_as_the_same_items() -> None:
    # What `items.list` returns goes back into `items.create` unchanged.
    items = langgraph_converter.to_items(
        [
            HumanMessage("Table for 2 at 8?"),
            AIMessage("Booking.", tool_calls=[{"id": "t1", "name": "book", "args": {"people": 2}}]),
            ToolMessage("confirmed", tool_call_id="t1"),
        ]
    )
    stored = [{**item, "id": f"item_{i}"} for i, item in enumerate(items)]
    plain = langgraph_converter.from_items(stored)
    assert langgraph_converter.to_items(plain) == items


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
