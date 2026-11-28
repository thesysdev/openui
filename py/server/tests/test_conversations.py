"""`openui.conversations`: calls by id act as the org; the owner is set on create."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import httpx
import pytest
from support import FakeCloud, settle

from openui_server import OpenUIApiError

CONVERSATION = {
    "id": "c1",
    "title": "T",
    "user_id": "u1",
    "app_id": "app1",
    "created_at": 1700000000,
}


async def test_create_names_the_owner_and_app_in_the_body(cloud: FakeCloud, kind: str) -> None:
    cloud.on("POST", "/v1/conversations", CONVERSATION)
    openui = cloud.client(kind, app_id="app1")
    conversation = await settle(
        openui.conversations.create(user_id="u1", title="T", metadata={"a": "b"})
    )
    assert cloud.last.query == {}
    assert cloud.last.body == {
        "title": "T",
        "metadata": {"a": "b"},
        "user_id": "u1",
        "app_id": "app1",
    }
    assert conversation.user_id == "u1"
    assert conversation.created_at == datetime(2023, 11, 14, 22, 13, 20, tzinfo=UTC)


async def test_create_needs_an_owner(cloud: FakeCloud, kind: str) -> None:
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).conversations.create(user_id=None, title="T"))
    assert error.value.code == "invalid_input"
    assert cloud.sent == []


async def test_list_filters_by_owner_only(cloud: FakeCloud, kind: str) -> None:
    page = {"data": [CONVERSATION], "has_more": True, "first_id": "c1", "last_id": "c1"}
    cloud.on("GET", "/v1/conversations", page)
    openui = cloud.client(kind, app_id="app1")
    result = await settle(openui.conversations.list(user_id="u1", limit=5, after="c0"))
    # No app_id: the filter lists the owner's conversations in every app.
    assert cloud.last.query == {"user_id": ["u1"], "limit": ["5"], "after": ["c0"]}
    assert (result.has_more, result.last_id, result.data[0].id) == (True, "c1", "c1")

    await settle(openui.conversations.list())
    assert cloud.last.query == {}


async def test_calls_by_id_send_no_user(cloud: FakeCloud, kind: str) -> None:
    cloud.on("GET", "/v1/conversations/c1", CONVERSATION)
    cloud.on("POST", "/v1/conversations/c1", {**CONVERSATION, "title": "T2"})
    cloud.on("DELETE", "/v1/conversations/c1", {"id": "c1", "deleted": True})
    openui = cloud.client(kind, app_id="app1")

    await settle(openui.conversations.get("c1"))
    updated = await settle(openui.conversations.update("c1", title="T2"))
    await settle(openui.conversations.delete("c1"))

    assert [(s.method, s.query, s.body) for s in cloud.sent] == [
        ("GET", {}, None),
        ("POST", {}, {"title": "T2"}),
        ("DELETE", {}, None),
    ]
    assert updated.title == "T2"


async def test_item_calls_go_by_id(cloud: FakeCloud, kind: str) -> None:
    item = {
        "id": "i1",
        "object": "conversation.item",
        "type": "message",
        "role": "user",
        "content": "hi",
    }
    cloud.on("GET", "/v1/conversations/c1/items", {"data": [item], "has_more": False})
    cloud.on("POST", "/v1/conversations/c1/items", {"data": [item], "has_more": False})
    cloud.on("GET", "/v1/conversations/c1/items/i1", item)
    cloud.on("POST", "/v1/conversations/c1/items/i1", {**item, "content": "edited"})
    items = cloud.client(kind).conversations.items

    page = await settle(items.list("c1", order="asc", limit=2))
    stored = await settle(
        items.create("c1", [{"type": "message", "role": "user", "content": "hi"}])
    )
    await settle(items.get("c1", "i1"))
    edited = await settle(items.update("c1", "i1", content="edited", status="completed"))

    assert cloud.sent[0].query == {"limit": ["2"], "order": ["asc"]}
    assert cloud.sent[1].body == {"items": [{"type": "message", "role": "user", "content": "hi"}]}
    assert cloud.sent[3].body == {"content": "edited", "status": "completed"}
    assert all(s.query == {} for s in cloud.sent[1:])
    assert (page.data, stored, edited["content"]) == ([item], [item], "edited")


async def test_adding_no_items_sends_nothing(cloud: FakeCloud, kind: str) -> None:
    assert await settle(cloud.client(kind).conversations.items.create("c1", [])) == []
    assert cloud.sent == []


@pytest.mark.parametrize(("id", "items"), [("", []), ("c1", "not a list")])
async def test_item_input_is_checked_first(
    cloud: FakeCloud, kind: str, id: str, items: object
) -> None:
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).conversations.items.create(id, items))
    assert error.value.code == "invalid_input"


async def test_chat_list_reads_every_page_oldest_first(cloud: FakeCloud, kind: str) -> None:
    def page(request: object) -> dict[str, object]:
        after = request.url.params.get("after")  # type: ignore[attr-defined]
        if after is None:
            user = {"id": "i1", "type": "message", "role": "user", "content": "hi"}
            return {"data": [user], "has_more": True, "last_id": "i1"}
        reply = {"id": "i2", "type": "message", "role": "assistant", "content": "hello"}
        return {"data": [reply], "has_more": False, "last_id": "i2"}

    cloud.on("GET", "/v1/conversations/c1/items", page)
    messages = await settle(cloud.client(kind).chat.conversations.items.list("c1"))
    assert messages == [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
    ]
    assert [s.query for s in cloud.sent] == [
        {"limit": ["100"], "order": ["asc"]},
        {"limit": ["100"], "after": ["i1"], "order": ["asc"]},
    ]


def stored(request: httpx.Request) -> dict[str, Any]:
    """The items API: stores the items it's sent, in order, and returns them."""
    items = json.loads(request.content)["items"]
    return {"data": [{**item, "id": f"item_{i}"} for i, item in enumerate(items)]}


async def test_chat_create_returns_the_turn_as_stored_as_messages(
    cloud: FakeCloud, kind: str
) -> None:
    cloud.on("POST", "/v1/conversations/c1/items", stored)
    turn = [
        {"role": "system", "content": "rules"},
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
    ]
    returned = await settle(cloud.client(kind).chat.conversations.items.create("c1", turn))
    assert cloud.last.body == {
        "items": [
            {"type": "message", "role": "user", "content": [{"type": "input_text", "text": "hi"}]},
            {
                "type": "message",
                "role": "assistant",
                "content": [{"type": "output_text", "text": "hello"}],
            },
        ]
    }
    # The system message isn't stored, so it isn't returned.
    assert returned == turn[1:]


async def test_langgraph_create_takes_and_returns_plain_messages(
    cloud: FakeCloud, kind: str
) -> None:
    cloud.on("POST", "/v1/conversations/c1/items", stored)
    turn = [
        {"role": "human", "content": "Book a table"},
        {
            "role": "ai",
            "content": "",
            "tool_calls": [
                {"type": "tool_call", "id": "t1", "name": "book", "args": {"people": 2}}
            ],
        },
        {"role": "tool", "content": "booked", "tool_call_id": "t1"},
    ]
    returned = await settle(cloud.client(kind).langgraph.conversations.items.create("c1", turn))
    assert returned == turn
    assert cloud.last.body == {
        "items": [
            {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "Book a table"}],
            },
            {"type": "function_call", "call_id": "t1", "name": "book", "arguments": '{"people":2}'},
            {"type": "function_call_output", "call_id": "t1", "output": "booked"},
        ]
    }


async def test_message_forms_share_the_conversation_calls(cloud: FakeCloud, kind: str) -> None:
    cloud.on("GET", "/v1/conversations/c1", CONVERSATION)
    openui = cloud.client(kind)
    for conversations in (openui.chat.conversations, openui.langgraph.conversations):
        assert (await settle(conversations.get("c1"))).id == "c1"


async def test_chat_create_needs_a_list(cloud: FakeCloud, kind: str) -> None:
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).chat.conversations.items.create("c1", "hi"))
    assert error.value.code == "invalid_input"
