"""`OpenUIClient` and `AsyncOpenUIClient` (`client.ts`)."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Generic, TypeVar

import httpx

if TYPE_CHECKING:
    from langchain_core.messages import BaseMessage
    from openai.types.chat import ChatCompletionMessageParam
from .artifacts import Artifacts, AsyncArtifacts
from .artifacts.dashboards import AsyncDashboard, Dashboard, check_options
from .artifacts.dashboards.types import ReasoningEffort
from .conversations import (
    AsyncConversations,
    AsyncMessageConversations,
    Conversations,
    MessageConversations,
)
from .conversations.types import LangGraphHistoryMessage
from .core.cloud_config import PromptOptions
from .core.errors import invalid_input
from .core.http import DEFAULT_TIMEOUT, AsyncHttp, Cloud, SyncHttp
from .frontend_token import FrontendToken, frontend_token_call
from .interpreter.mcp import McpServers, data_tool_loader, mcp_servers
from .interpreter.types import DataTool
from .langgraph.messages import langgraph_converter
from .openai.autofix import AsyncChatAutofix, ChatAutofix, async_chat_autofix, chat_autofix
from .openai.messages import chat_completions_converter


def _cloud(api_key: str | None, base_url: str | None, app_id: str | None) -> Cloud:
    if app_id is not None and (not isinstance(app_id, str) or not app_id.strip()):
        raise invalid_input("app_id must be a non-empty string")
    return Cloud(api_key, base_url, app_id)


C = TypeVar("C")


class Chat:
    """Chat Completions (`openui.chat`): `conversations` with items as its messages, and
    `create_autofix`. Types come from `openai`."""

    conversations: MessageConversations[ChatCompletionMessageParam, ChatCompletionMessageParam]

    def __init__(
        self,
        conversations: MessageConversations[ChatCompletionMessageParam, ChatCompletionMessageParam],
        http: SyncHttp,
    ) -> None:
        self.conversations, self._http = conversations, http

    def create_autofix(self, *, library: Mapping[str, Any]) -> ChatAutofix:
        """Autofix for one library: the JSON `openui generate --spec` writes for the same
        components as your renderer, with its `schema`. Returns `fix` and `stream`, which use
        the client's key."""
        return chat_autofix(self._http, library)


class AsyncChat:
    """`Chat`, for `AsyncOpenUIClient`."""

    conversations: AsyncMessageConversations[ChatCompletionMessageParam, ChatCompletionMessageParam]

    def __init__(
        self,
        conversations: AsyncMessageConversations[
            ChatCompletionMessageParam, ChatCompletionMessageParam
        ],
        http: AsyncHttp,
    ) -> None:
        self.conversations, self._http = conversations, http

    def create_autofix(self, *, library: Mapping[str, Any]) -> AsyncChatAutofix:
        return async_chat_autofix(self._http, library)


@dataclass(frozen=True, slots=True)
class LangGraph(Generic[C]):
    """LangGraph (`openui.langgraph`): `conversations` with items as LangChain messages;
    `items.list` returns what `graph.invoke` takes. Types come from `langchain-core`."""

    conversations: C


class OpenUIClient:
    """One client for OpenUI Cloud on your server. Reads your API key from `THESYS_API_KEY`
    unless you pass `api_key`.

    `app_id`: your app, when one API key serves several. Users' frontend tokens and artifacts
    belong to it, and generated scripts run only from it. `http_client`: your own
    `httpx.Client`, for proxies or custom transports; the client won't close it."""

    artifacts: Artifacts
    """Your saved artifacts. Without `user_id`, calls cover every user in your org; with it,
    they act as that user."""
    conversations: Conversations
    """Your users' conversations and their items. Without `user_id`, calls cover every user in
    your org; with it, they act as that user."""
    chat: Chat
    """Chat Completions: `chat.conversations` takes and returns its messages, and
    `chat.create_autofix(library=...)` checks and repairs model output in OpenUI Lang."""
    langgraph: LangGraph[MessageConversations[BaseMessage, LangGraphHistoryMessage]]
    """`langgraph.conversations`: `conversations`, in LangGraph's messages. `items.create`
    takes LangChain messages, and `items.list` reads a whole thread back as messages
    `graph.invoke` takes."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        app_id: str | None = None,
        timeout: float | httpx.Timeout = DEFAULT_TIMEOUT,
        http_client: httpx.Client | None = None,
    ) -> None:
        self._http = SyncHttp(_cloud(api_key, base_url, app_id), http_client, timeout)
        self.artifacts = Artifacts(self._http)
        self.conversations = Conversations(self._http)
        chat: MessageConversations[ChatCompletionMessageParam, ChatCompletionMessageParam] = (
            self.conversations._with_messages(chat_completions_converter)
        )
        langgraph: MessageConversations[BaseMessage, LangGraphHistoryMessage] = (
            self.conversations._with_messages(langgraph_converter)
        )
        self.chat, self.langgraph = Chat(chat, self._http), LangGraph(langgraph)

    def create_frontend_token(
        self, *, user_id: str, group_ids: Sequence[str] | None = None
    ) -> FrontendToken:
        """Mints the signed-in user's frontend token. Return it from your token route as is.
        `group_ids` (up to 10): the groups the user is in, so artifacts shared with them are
        readable too; the token carries them until it expires."""
        return self._http.call(frontend_token_call(self._http.cloud.app_id, user_id, group_ids))

    def define_dashboard(
        self,
        *,
        library: Mapping[str, Any],
        model: str,
        tools: Mapping[str, DataTool],
        reasoning_effort: ReasoningEffort | None = None,
        max_tool_rounds: int | None = None,
        prompt_options: PromptOptions | None = None,
    ) -> Dashboard:
        """Defines live dashboards from your library and data tools; its `interpreter` runs
        them. `library` is the JSON `openui generate --spec` writes. `model` builds and edits
        dashboards, as `provider/model`. `max_tool_rounds`: rounds of tool calls before the
        model must write the dashboard (OpenUI Cloud's default: 20). MCP tools need
        `AsyncOpenUIClient`."""
        options = check_options(
            library=library,
            model=model,
            has_tools=isinstance(tools, Mapping),
            reasoning_effort=reasoning_effort,
            max_tool_rounds=max_tool_rounds,
            prompt_options=prompt_options,
            app_id=self._http.cloud.app_id,
        )
        return Dashboard(self._http, options, dict(tools))

    def close(self) -> None:
        """Closes the client's connections, unless you passed your own `http_client`."""
        self._http.close()

    def __enter__(self) -> OpenUIClient:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


class AsyncOpenUIClient:
    """`OpenUIClient` for asyncio: the same calls, awaited. Dashboards can also take MCP tools,
    and data tools may be `async def`."""

    artifacts: AsyncArtifacts
    conversations: AsyncConversations
    chat: AsyncChat
    langgraph: LangGraph[AsyncMessageConversations[BaseMessage, LangGraphHistoryMessage]]

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        app_id: str | None = None,
        timeout: float | httpx.Timeout = DEFAULT_TIMEOUT,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._http = AsyncHttp(_cloud(api_key, base_url, app_id), http_client, timeout)
        self.artifacts = AsyncArtifacts(self._http)
        self.conversations = AsyncConversations(self._http)
        chat: AsyncMessageConversations[ChatCompletionMessageParam, ChatCompletionMessageParam] = (
            self.conversations._with_messages(chat_completions_converter)
        )
        langgraph: AsyncMessageConversations[BaseMessage, LangGraphHistoryMessage] = (
            self.conversations._with_messages(langgraph_converter)
        )
        self.chat, self.langgraph = AsyncChat(chat, self._http), LangGraph(langgraph)

    async def create_frontend_token(
        self, *, user_id: str, group_ids: Sequence[str] | None = None
    ) -> FrontendToken:
        return await self._http.call(
            frontend_token_call(self._http.cloud.app_id, user_id, group_ids)
        )

    def define_dashboard(
        self,
        *,
        library: Mapping[str, Any],
        model: str,
        tools: Mapping[str, DataTool] | None = None,
        mcp: McpServers | None = None,
        reasoning_effort: ReasoningEffort | None = None,
        max_tool_rounds: int | None = None,
        prompt_options: PromptOptions | None = None,
    ) -> AsyncDashboard:
        """`OpenUIClient.define_dashboard`, plus `mcp`: an MCP client such as
        `mcp.ClientSession`, `McpConfig(client=...)`, or a list of them. Their tools are listed
        on first use; by default only the ones the server marks read-only."""
        options = check_options(
            library=library,
            model=model,
            has_tools=isinstance(tools, Mapping) or bool(mcp_servers(mcp)),
            reasoning_effort=reasoning_effort,
            max_tool_rounds=max_tool_rounds,
            prompt_options=prompt_options,
            app_id=self._http.cloud.app_id,
        )
        return AsyncDashboard(self._http, options, data_tool_loader(tools, mcp))

    async def aclose(self) -> None:
        """Closes the client's connections, unless you passed your own `http_client`."""
        await self._http.aclose()

    async def __aenter__(self) -> AsyncOpenUIClient:
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.aclose()
