"""`openui.conversations` and its `chat` / `langgraph` forms (`conversations/index.ts`)."""

from __future__ import annotations

import builtins
from collections.abc import Callable, Mapping, Sequence
from typing import Any, Generic, TypeVar
from urllib.parse import quote

from ..core.act_as import act_as
from ..core.errors import invalid_input, invalid_response
from ..core.http import AsyncHttp, Call, SyncHttp
from ..core.resource import Order, Page, compact, id_path, query_number, timestamp, to_page
from .types import Conversation, ConversationItem, ConversationItemInput, ConversationItemStatus

In = TypeVar("In")


Out = TypeVar("Out")


ItemsT = TypeVar("ItemsT")


def to_conversation(row: Any) -> Conversation:
    if not isinstance(row, dict) or not isinstance(row.get("id"), str):
        raise invalid_response()
    return Conversation(
        id=row["id"],
        title=row.get("title"),
        metadata=row.get("metadata"),
        user_id=row.get("user_id"),
        app_id=row.get("app_id"),
        created_at=timestamp(row.get("created_at")),
    )


# Items keep OpenAI's shape, so one read back can be added to a conversation again as is.
def to_item(row: Any) -> ConversationItem:
    if (
        not isinstance(row, dict)
        or not isinstance(row.get("id"), str)
        or not isinstance(row.get("type"), str)
    ):
        raise invalid_response()
    return row


def _path(id: object, suffix: str = "") -> str:
    return id_path("conversations", id, suffix)


def _item_path(id: object, item_id: object) -> str:
    if not isinstance(item_id, str) or not item_id:
        raise invalid_input("item_id is required")
    return _path(id, f"/items/{quote(item_id, safe='')}")


def _items_of(page: dict[str, Any]) -> list[ConversationItem]:
    return to_page(page, to_item).data


class ConversationCalls:
    """Each conversation call, built once for both clients."""

    def __init__(self, app_id: str | None) -> None:
        self._app_id = app_id

    def _as(self, user_id: str | None) -> dict[str, str | list[str]]:
        return act_as(self._app_id, user_id, None)

    def list(
        self, user_id: str | None, limit: int | None, after: str | None, before: str | None
    ) -> Call[Page[Conversation]]:
        query = {
            **self._as(user_id),
            "limit": query_number(limit),
            "after": after,
            "before": before,
        }
        return Call("GET", "/v1/conversations", lambda p: to_page(p, to_conversation), query=query)

    # An owner, so the user's frontend token can read it too: without one, only the API key can.
    def create(
        self, title: str | None, metadata: Mapping[str, str] | None, user_id: str | None
    ) -> Call[Conversation]:
        if user_id is None:
            raise invalid_input(
                "user_id is required: the conversation is that user's, for their frontend token"
            )
        query = self._as(user_id)
        body = compact(title=title, metadata=metadata)
        return Call("POST", "/v1/conversations", to_conversation, query=query, body=body)

    def get(self, id: str, user_id: str | None) -> Call[Conversation]:
        return Call("GET", _path(id), to_conversation, query=self._as(user_id))

    def update(
        self,
        id: str,
        title: str | None,
        metadata: Mapping[str, str] | None,
        user_id: str | None,
    ) -> Call[Conversation]:
        query = self._as(user_id)
        body = compact(title=title, metadata=metadata)
        return Call("POST", _path(id), to_conversation, query=query, body=body)

    def delete(self, id: str, user_id: str | None) -> Call[None]:
        return Call("DELETE", _path(id), lambda _: None, query=self._as(user_id))

    def list_items(
        self,
        id: str,
        user_id: str | None,
        limit: int | None,
        after: str | None,
        before: str | None,
        order: Order | None,
    ) -> Call[Page[ConversationItem]]:
        query = {
            **self._as(user_id),
            "limit": query_number(limit),
            "after": after,
            "before": before,
            "order": order,
        }
        return Call("GET", _path(id, "/items"), lambda p: to_page(p, to_item), query=query)

    def create_items(
        self, id: str, items: Sequence[ConversationItemInput], user_id: str | None
    ) -> Call[builtins.list[ConversationItem]] | None:
        """None when there's nothing to add, so no request is made."""
        if not isinstance(items, list | tuple):
            raise invalid_input("items must be a list")
        # Checked first, so a bad id or user_id fails even with no items.
        path, query = _path(id, "/items"), self._as(user_id)
        if not items:
            return None
        return Call("POST", path, _items_of, query=query, body={"items": list(items)})

    def get_item(self, id: str, item_id: str, user_id: str | None) -> Call[ConversationItem]:
        return Call("GET", _item_path(id, item_id), to_item, query=self._as(user_id))

    def update_item(
        self,
        id: str,
        item_id: str,
        content: Any,
        status: ConversationItemStatus | None,
        user_id: str | None,
    ) -> Call[ConversationItem]:
        query = self._as(user_id)
        body = compact(content=content, status=status)
        return Call("POST", _item_path(id, item_id), to_item, query=query, body=body)


class ConversationItems:
    """A conversation's messages and tool calls, in OpenAI's Conversations API shape."""

    def __init__(self, http: SyncHttp, calls: ConversationCalls) -> None:
        self._http, self._calls = http, calls

    def list(
        self,
        id: str,
        *,
        user_id: str | None = None,
        limit: int | None = None,
        after: str | None = None,
        before: str | None = None,
        order: Order | None = None,
    ) -> Page[ConversationItem]:
        """One page of items, newest first. `order="asc"` reads a thread from its start."""
        return self._http.call(self._calls.list_items(id, user_id, limit, after, before, order))

    def create(
        self,
        id: str,
        items: Sequence[ConversationItemInput],
        *,
        user_id: str | None = None,
    ) -> builtins.list[ConversationItem]:
        """Adds items in order and returns them as stored. Add only the new turn: earlier items
        are already there. Up to 100 a call; none makes no call."""
        call = self._calls.create_items(id, items, user_id)
        return [] if call is None else self._http.call(call)

    def get(self, id: str, item_id: str, *, user_id: str | None = None) -> ConversationItem:
        return self._http.call(self._calls.get_item(id, item_id, user_id))

    def update(
        self,
        id: str,
        item_id: str,
        *,
        content: Any = None,
        status: ConversationItemStatus | None = None,
        user_id: str | None = None,
    ) -> ConversationItem:
        """Only an item's content and status change."""
        return self._http.call(self._calls.update_item(id, item_id, content, status, user_id))


class MessageItems(Generic[In, Out]):
    """A conversation's items as one SDK's messages."""

    def __init__(
        self,
        items: ConversationItems,
        to_items: Callable[[Sequence[In]], Sequence[ConversationItemInput]],
        from_items: Callable[[builtins.list[ConversationItem]], list[Out]],
    ) -> None:
        self._items, self._to_items, self._from_items = items, to_items, from_items

    def create(
        self, id: str, messages: Sequence[In], *, user_id: str | None = None
    ) -> builtins.list[ConversationItem]:
        """Converts the messages to items and adds them in order, then returns the items as
        stored. Add only the new turn: earlier messages are already there."""
        if not isinstance(messages, list | tuple):
            raise invalid_input("messages must be a list")
        return self._items.create(id, self._to_items(messages), user_id=user_id)

    # Every page, since a reply's text and its tool calls can sit on either side of one.
    def list(self, id: str, *, user_id: str | None = None) -> builtins.list[Out]:
        """The whole thread as messages, oldest first, ready to send to the model."""
        thread: builtins.list[ConversationItem] = []
        after: str | None = None
        while True:
            page = self._items.list(id, user_id=user_id, order="asc", limit=100, after=after)
            thread += page.data
            after = page.last_id if page.has_more else None
            if not after:
                return self._from_items(thread)


class _BaseConversations(Generic[ItemsT]):
    items: ItemsT

    def __init__(self, http: SyncHttp, calls: ConversationCalls, items: ItemsT) -> None:
        self._http, self._calls, self.items = http, calls, items

    def list(
        self,
        *,
        user_id: str | None = None,
        limit: int | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> Page[Conversation]:
        """One page of conversations, newest first."""
        return self._http.call(self._calls.list(user_id, limit, after, before))

    def create(
        self,
        *,
        user_id: str,
        title: str | None = None,
        metadata: Mapping[str, str] | None = None,
    ) -> Conversation:
        """Creates it for `user_id`, so their frontend token can read it too. Metadata: up to
        16 pairs, keys up to 64 characters, values up to 512."""
        return self._http.call(self._calls.create(title, metadata, user_id))

    def get(self, id: str, *, user_id: str | None = None) -> Conversation:
        return self._http.call(self._calls.get(id, user_id))

    def update(
        self,
        id: str,
        *,
        title: str | None = None,
        metadata: Mapping[str, str] | None = None,
        user_id: str | None = None,
    ) -> Conversation:
        return self._http.call(self._calls.update(id, title, metadata, user_id))

    def delete(self, id: str, *, user_id: str | None = None) -> None:
        """Deleted conversations can't be restored."""
        self._http.call(self._calls.delete(id, user_id))


class Conversations(_BaseConversations[ConversationItems]):
    """Your users' conversations and their items. Without `user_id`, calls cover every user in
    your org; with it, they act as that user, in the client's app. Take `user_id` from your
    session, never from the browser."""

    def __init__(self, http: SyncHttp) -> None:
        calls = ConversationCalls(http.cloud.app_id)
        super().__init__(http, calls, ConversationItems(http, calls))

    def _with_messages(
        self,
        to_items: Callable[[Sequence[In]], Sequence[ConversationItemInput]],
        from_items: Callable[[builtins.list[ConversationItem]], list[Out]],
    ) -> MessageConversations[In, Out]:
        """The same conversations, with items taken and read back as one SDK's messages."""
        items = MessageItems(self.items, to_items, from_items)
        return MessageConversations(self._http, self._calls, items)


class MessageConversations(_BaseConversations[MessageItems[In, Out]]):
    """`conversations`, with items taken and read back as one SDK's messages."""


class AsyncConversationItems:
    """`ConversationItems`, for `AsyncOpenUIClient`."""

    def __init__(self, http: AsyncHttp, calls: ConversationCalls) -> None:
        self._http, self._calls = http, calls

    async def list(
        self,
        id: str,
        *,
        user_id: str | None = None,
        limit: int | None = None,
        after: str | None = None,
        before: str | None = None,
        order: Order | None = None,
    ) -> Page[ConversationItem]:
        return await self._http.call(
            self._calls.list_items(id, user_id, limit, after, before, order)
        )

    async def create(
        self,
        id: str,
        items: Sequence[ConversationItemInput],
        *,
        user_id: str | None = None,
    ) -> builtins.list[ConversationItem]:
        call = self._calls.create_items(id, items, user_id)
        return [] if call is None else await self._http.call(call)

    async def get(self, id: str, item_id: str, *, user_id: str | None = None) -> ConversationItem:
        return await self._http.call(self._calls.get_item(id, item_id, user_id))

    async def update(
        self,
        id: str,
        item_id: str,
        *,
        content: Any = None,
        status: ConversationItemStatus | None = None,
        user_id: str | None = None,
    ) -> ConversationItem:
        return await self._http.call(self._calls.update_item(id, item_id, content, status, user_id))


class AsyncMessageItems(Generic[In, Out]):
    """`MessageItems`, for `AsyncOpenUIClient`."""

    def __init__(
        self,
        items: AsyncConversationItems,
        to_items: Callable[[Sequence[In]], Sequence[ConversationItemInput]],
        from_items: Callable[[builtins.list[ConversationItem]], list[Out]],
    ) -> None:
        self._items, self._to_items, self._from_items = items, to_items, from_items

    async def create(
        self, id: str, messages: Sequence[In], *, user_id: str | None = None
    ) -> builtins.list[ConversationItem]:
        if not isinstance(messages, list | tuple):
            raise invalid_input("messages must be a list")
        return await self._items.create(id, self._to_items(messages), user_id=user_id)

    async def list(self, id: str, *, user_id: str | None = None) -> builtins.list[Out]:
        thread: builtins.list[ConversationItem] = []
        after: str | None = None
        while True:
            page = await self._items.list(id, user_id=user_id, order="asc", limit=100, after=after)
            thread += page.data
            after = page.last_id if page.has_more else None
            if not after:
                return self._from_items(thread)


class _AsyncBaseConversations(Generic[ItemsT]):
    items: ItemsT

    def __init__(self, http: AsyncHttp, calls: ConversationCalls, items: ItemsT) -> None:
        self._http, self._calls, self.items = http, calls, items

    async def list(
        self,
        *,
        user_id: str | None = None,
        limit: int | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> Page[Conversation]:
        return await self._http.call(self._calls.list(user_id, limit, after, before))

    async def create(
        self,
        *,
        user_id: str,
        title: str | None = None,
        metadata: Mapping[str, str] | None = None,
    ) -> Conversation:
        return await self._http.call(self._calls.create(title, metadata, user_id))

    async def get(self, id: str, *, user_id: str | None = None) -> Conversation:
        return await self._http.call(self._calls.get(id, user_id))

    async def update(
        self,
        id: str,
        *,
        title: str | None = None,
        metadata: Mapping[str, str] | None = None,
        user_id: str | None = None,
    ) -> Conversation:
        return await self._http.call(self._calls.update(id, title, metadata, user_id))

    async def delete(self, id: str, *, user_id: str | None = None) -> None:
        await self._http.call(self._calls.delete(id, user_id))


class AsyncConversations(_AsyncBaseConversations[AsyncConversationItems]):
    """`Conversations`, for `AsyncOpenUIClient`."""

    def __init__(self, http: AsyncHttp) -> None:
        calls = ConversationCalls(http.cloud.app_id)
        super().__init__(http, calls, AsyncConversationItems(http, calls))

    def _with_messages(
        self,
        to_items: Callable[[Sequence[In]], Sequence[ConversationItemInput]],
        from_items: Callable[[builtins.list[ConversationItem]], list[Out]],
    ) -> AsyncMessageConversations[In, Out]:
        items = AsyncMessageItems(self.items, to_items, from_items)
        return AsyncMessageConversations(self._http, self._calls, items)


class AsyncMessageConversations(_AsyncBaseConversations[AsyncMessageItems[In, Out]]):
    """`MessageConversations`, for `AsyncOpenUIClient`."""
