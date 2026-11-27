"""An MCP server's tools as data tools (`interpreter/mcp.ts`), for `AsyncOpenUIClient`: Python's
MCP SDK is async. Fields are read under both of its spellings: camelCase up to 1.x, snake_case
from 2.0."""

from __future__ import annotations

import asyncio
import inspect
import json
import re
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass, field
from typing import (
    TYPE_CHECKING,
    Any,
    Protocol,
)

if TYPE_CHECKING:
    from mcp.types import Tool as McpTool
from .types import DataTool, ExecutionContext, ToolExecutionError


class McpClient(Protocol):
    """An MCP client, such as `mcp.ClientSession`."""

    async def list_tools(self, *, params: Any = None) -> Any: ...
    async def call_tool(self, name: str, arguments: dict[str, Any] | None = None) -> Any: ...


@dataclass(frozen=True, kw_only=True)
class McpConfig:
    """Which tools an MCP server offers your dashboards, and how calls reach it."""

    client: McpClient
    include: Sequence[str] | Callable[[McpTool], bool] | None = None
    """Which tools to offer, by MCP name or with a filter. Default: the tools the server marks
    read-only (`readOnlyHint`), since scripts run on every view."""
    outputs: Mapping[str, Any] = field(default_factory=dict)
    """Example outputs by MCP tool name, so dashboards know the shape of the data."""
    connect: Callable[[ExecutionContext], McpClient | Awaitable[McpClient]] | None = None
    """The client each call goes through, such as one with the signed-in user's credentials
    from `context`. Defaults to `client`."""


def merge_tools(own: Mapping[str, DataTool], mcp: Mapping[str, DataTool]) -> dict[str, DataTool]:
    """Your tools plus an MCP server's, refusing two with one name."""
    for name in mcp:
        if name in own:
            raise ToolExecutionError(
                f"Two data tools are named {name}: rename yours or leave an MCP one out",
                "invalid_tools",
            )
    return {**own, **mcp}


McpServers = McpClient | McpConfig | Sequence[McpClient | McpConfig]


def _field(value: Any, *names: str) -> Any:
    for name in names:
        found = value.get(name) if isinstance(value, Mapping) else getattr(value, name, None)
        if found is not None:
            return found
    return None


def _plain(value: Any) -> Any:
    """MCP's pydantic models as JSON data."""
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json", by_alias=True, exclude_none=True)
    if isinstance(value, list):
        return [_plain(item) for item in value]
    return value


def _text_of(content: Any) -> str | None:
    if not isinstance(content, list):
        return None
    texts = [
        text
        for part in content
        if _field(part, "type") == "text" and isinstance(text := _field(part, "text"), str)
    ]
    return "\n".join(texts) if texts else None


def _result_of(result: Any) -> Any:
    """Structured content when the tool returns it, else its text, parsed as JSON when it is."""
    structured = _field(result, "structured_content", "structuredContent")
    if structured is not None:
        return _plain(structured)
    content = _field(result, "content")
    if content is None and _field(result, "toolResult") is not None:
        return _plain(_field(result, "toolResult"))
    text = _text_of(content)
    if text is None:
        return _plain(content)
    try:
        return json.loads(text)
    except ValueError:
        return text


def _set_arguments(args: Mapping[str, Any], required: set[str]) -> dict[str, Any]:
    """A dashboard filter nobody has picked yet arrives as "" or None. MCP servers validate
    strictly, so leave those out of optional arguments, as if they weren't passed. A required one
    still goes as is, for the server to judge."""
    return {
        key: value
        for key, value in args.items()
        if key in required or (value != "" and value is not None)
    }


def _tool_key(name: str) -> str:
    """Generation needs tool names like `get_sales`; MCP names often have `-` or `.`."""
    key = re.sub(r"[^A-Za-z0-9_]", "_", name)
    return f"_{key}" if key[:1].isdigit() else key


def _invalid_tools(message: str) -> ToolExecutionError:
    return ToolExecutionError(message, "invalid_tools")


def mcp_servers(mcp: McpServers | None) -> list[McpClient | McpConfig]:
    """`mcp` as a list: none, one server, or several."""
    if mcp is None:
        return []
    return list(mcp) if isinstance(mcp, list | tuple) else [mcp]  # type: ignore[list-item]


async def _list_tools(client: McpClient) -> list[Any]:
    listed: list[Any] = []
    cursor: str | None = None
    while True:
        if cursor is None:
            page = await client.list_tools()
        else:
            from mcp.types import PaginatedRequestParams  # Only reached with the MCP SDK's client.

            page = await client.list_tools(params=PaginatedRequestParams(cursor=cursor))
        listed += _field(page, "tools") or []
        cursor = _field(page, "next_cursor", "nextCursor")
        if not cursor:
            return listed


def mcp_tool_loader(option: McpClient | McpConfig) -> Callable[[], Awaitable[dict[str, DataTool]]]:
    """Lists an MCP server's tools on first use, and the same ones after that: each becomes a
    data tool whose calls go through `connect(context)`. A failed listing is retried next time."""
    config = option if isinstance(option, McpConfig) else McpConfig(client=option)
    if not callable(getattr(config.client, "list_tools", None)):
        raise _invalid_tools("mcp takes an MCP client, or McpConfig(client=...) with one")
    tools: dict[str, DataTool] | None = None
    lock = asyncio.Lock()

    def included(tool: Any) -> bool:
        if config.include is None:
            return _field(_field(tool, "annotations"), "read_only_hint", "readOnlyHint") is True
        if callable(config.include):
            return config.include(tool)
        return _field(tool, "name") in config.include

    def data_tool(tool: Any) -> DataTool:
        name: str = _field(tool, "name")
        schema = _plain(_field(tool, "input_schema", "inputSchema")) or {"type": "object"}
        required = set(schema.get("required") or [])

        async def execute(args: dict[str, Any], context: ExecutionContext) -> Any:
            client = config.client
            if config.connect is not None:
                connected = config.connect(context)
                client = await connected if inspect.isawaitable(connected) else connected
            result = await client.call_tool(name, _set_arguments(args, required))
            # MCP reports a failed call in its result: raise so it surfaces as a tool error.
            if _field(result, "is_error", "isError") is True:
                message = _text_of(_field(result, "content")) or f"{name} failed"
                raise ToolExecutionError(message, "tool_exec_error")
            return _result_of(result)

        description = _field(tool, "description")
        return DataTool(
            execute=execute,
            parameters=schema,
            description=description,
            output=config.outputs.get(name),
        )

    async def load() -> dict[str, DataTool]:
        try:
            listed = await _list_tools(config.client)
        except Exception as error:
            raise ToolExecutionError(
                f"Couldn't list the MCP server's tools: {error}", "mcp_error", 502
            ) from error
        chosen = [tool for tool in listed if included(tool)]
        if not chosen:
            raise _invalid_tools(
                "The MCP server marks no tools read-only: pick them with `include`"
                if config.include is None
                else "No MCP tools match `include`"
            )
        loaded: dict[str, DataTool] = {}
        for tool in chosen:
            key = _tool_key(_field(tool, "name"))
            if key in loaded:
                raise _invalid_tools(f"Two MCP tools map to the name {key}")
            loaded[key] = data_tool(tool)
        return loaded

    async def get() -> dict[str, DataTool]:
        nonlocal tools
        async with lock:
            if tools is None:
                tools = await load()
        return tools

    return get


def data_tool_loader(
    tools: Mapping[str, DataTool] | None, mcp: McpServers | None
) -> Callable[[], Awaitable[dict[str, DataTool]]]:
    """Your data tools and your MCP servers', merged."""
    loaders = [mcp_tool_loader(server) for server in mcp_servers(mcp)]

    async def load() -> dict[str, DataTool]:
        merged = dict(tools or {})
        for listed in await asyncio.gather(*(loader() for loader in loaders)):
            merged = merge_tools(merged, listed)
        return merged

    return load
