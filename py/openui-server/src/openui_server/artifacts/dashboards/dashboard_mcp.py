"""The dashboard tools as an MCP server (`artifacts/dashboards/dashboard-mcp.ts`), written for
Python's MCP SDK rather than ported.

TS returns an `McpServer` plus a fetch handler with its own client transport. Python's SDK covers
both uses with one object, its low-level `Server`, so that's what `mcp_server()` returns:

- `mcp.client.Client(server)` connects to it in this process;
- `server.streamable_http_app()` serves it over Streamable HTTP, as an ASGI app.

One server serves every user: a `resolve(request)` function finds each call's user from the HTTP
request (None in process). The tool copy, schemas and results are the same as `tools()`'s."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping, Sequence
from typing import TYPE_CHECKING, Any

from ...core.errors import OpenUIApiError, invalid_input
from ...interpreter.types import assert_context
from .dashboard_tools import (
    RESULT_REMINDER,
    SERVER_INSTRUCTIONS,
    ToolUser,
    explain,
    mcp_tool_list,
    resolve_user,
    run_tool_async,
)

if TYPE_CHECKING:
    from mcp.server.lowlevel import Server

    from . import AsyncDashboard


def _missing_mcp() -> OpenUIApiError:
    return OpenUIApiError(
        "Dashboards over MCP need the mcp package, 2.0 or later: pip install 'openui-server[mcp]'",
        "missing_dependency",
    )


def dashboard_mcp_server(
    dashboard: AsyncDashboard,
    data: Callable[[], Awaitable[Sequence[Mapping[str, Any]]]],
    user: ToolUser,
) -> Server[Any]:
    """Returns at once, so it can be mounted at import time: the data tools are loaded when a
    client first lists the tools."""
    try:
        from mcp import types
        from mcp.server.lowlevel import Server
    except ImportError:
        raise _missing_mcp() from None
    if not callable(user):
        assert_context(user)

    async def list_tools(ctx: Any, params: Any) -> types.ListToolsResult:
        # Plain JSON schemas, as TS installs them under `registerTool`: no pydantic models.
        tools = mcp_tool_list(await data())
        return types.ListToolsResult(tools=[types.Tool.model_validate(t) for t in tools])

    async def call_tool(ctx: Any, params: types.CallToolRequestParams) -> types.CallToolResult:
        name, args = params.name, dict(params.arguments or {})
        try:
            context = await resolve_user(user, getattr(ctx, "request", None))
            if context is None:
                raise invalid_input("No signed-in user for this request.")
            text = await run_tool_async(dashboard, name, args, context)
        except Exception as error:
            message = types.TextContent(type="text", text=explain(error, name, args))
            return types.CallToolResult(content=[message], is_error=True)
        # The renderer reads content[0]; the reminder is a separate part after it.
        content: list[Any] = [types.TextContent(type="text", text=text)]
        if name in RESULT_REMINDER:
            content.append(types.TextContent(type="text", text=RESULT_REMINDER[name]))
        return types.CallToolResult(content=content)

    try:
        return Server(
            "openui-dashboards",
            title="OpenUI Dashboards",
            version="1.0.0",
            instructions=SERVER_INSTRUCTIONS,
            on_list_tools=list_tools,
            on_call_tool=call_tool,
        )
    except TypeError:  # mcp 1.x: handlers were decorators.
        raise _missing_mcp() from None
