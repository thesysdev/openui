"""Dashboard agent tools, the dashboards' MCP server, and MCP servers as data tools."""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest
from mcp.client.client import Client
from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations
from support import GOLDEN, FakeCloud, settle

from openui_server import DataTool, McpConfig, ToolExecutionError

ROUTE = "/v1/dashboard/chat/completions"
COPY = GOLDEN["dashboard_tools"]


def fake_cloud(cloud: FakeCloud) -> FakeCloud:
    """Builds start at once; a prompt with STATUS<n> fails with that status."""

    def build(request: httpx.Request) -> httpx.Response:
        prompt = json.loads(request.content)["messages"][1]["content"]
        for status in (403, 409, 429):
            if f"STATUS{status}" in prompt:
                return httpx.Response(
                    status, json={"error": {"code": f"e{status}", "message": "No"}}
                )
        content = f"[dashboard art_1] {prompt}"
        return httpx.Response(
            200, json={"choices": [{"finish_reason": "stop", "message": {"content": content}}]}
        )

    artifact = {
        "id": "art_1",
        "kind": "dashboard",
        "name": "Sales",
        "content": "root = Stack([])",
        "pinned": False,
        "is_editable": True,
        "created_at": 1,
    }
    cloud.on("POST", ROUTE, build)
    cloud.on("GET", "/v1/artifacts/art_1", artifact)
    return cloud


def board(cloud: FakeCloud, kind: str, library: dict[str, Any]) -> Any:
    tools = {
        name: DataTool(
            description=description or None, parameters={"type": "object"}, execute=lambda a, c: 1
        )
        for name, description in COPY["data_tools"].items()
    }
    openui = fake_cloud(cloud).client(kind, app_id="app1")
    return openui.define_dashboard(library=library, model="m", tools=tools)


async def test_tool_copy_and_schemas_match_typescript(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    tools = await settle(board(cloud, kind, library).tools({"user_id": "u1"}))
    assert {
        name: {"name": t.name, "description": t.description, "inputSchema": t.input_schema}
        for name, t in tools.items()
    } == COPY["tools"]


async def test_create_and_edit_return_the_response_and_a_reminder(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    tools = await settle(board(cloud, kind, library).tools({"user_id": "u1", "group_ids": ["g1"]}))
    created = await settle(
        tools["create_dashboard"].execute({"title": "Q3", "prompt": "Sales by region"})
    )
    assert created.startswith(
        "[dashboard art_1] Sales by region\n\nReply to the user in ONE short sentence"
    )
    edited = await settle(
        tools["edit_dashboard"].execute({"id": "art_1", "prompt": "Add a filter"})
    )
    assert edited.endswith(
        "Reply to the user in ONE short sentence saying what changed. Don't list the rest of the dashboard."
    )
    read = await settle(tools["get_dashboard"].execute({"id": "art_1"}))
    assert read == '{"name":"Sales","content":"root = Stack([])","isEditable":true}'


@pytest.mark.parametrize(
    ("name", "args", "sentence"),
    [
        ("create_dashboard", {"title": " ", "prompt": ""}, "title, prompt is required."),
        (
            "edit_dashboard",
            {"id": "art_1", "prompt": "STATUS403"},
            "This user can't change that dashboard. Offer to create a new one instead.",
        ),
        (
            "edit_dashboard",
            {"id": "art_1", "prompt": "STATUS409"},
            "That dashboard is being changed right now. Wait for the change to finish, then try again.",
        ),
        (
            "create_dashboard",
            {"title": "x", "prompt": "STATUS429"},
            "Too many dashboard requests right now. Tell the user to try again in a minute.",
        ),
        (
            "get_dashboard",
            {"id": "art_404"},
            "No dashboard with id art_404 that this user can open. Use the id from a create_dashboard or edit_dashboard result.",
        ),
    ],
)
async def test_failures_become_a_sentence_for_the_model(
    cloud: FakeCloud,
    kind: str,
    library: dict[str, Any],
    name: str,
    args: dict[str, str],
    sentence: str,
) -> None:
    tools = await settle(board(cloud, kind, library).tools({"user_id": "u1"}))
    with pytest.raises(ToolExecutionError) as error:
        await settle(tools[name].execute(args))
    assert error.value.message == sentence
    assert error.value.__cause__ is not None


async def test_a_resolver_finds_the_user_per_call(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    tools = await settle(board(cloud, kind, library).tools(lambda call: {"user_id": call["user"]}))
    await settle(tools["create_dashboard"].execute({"title": "t", "prompt": "p"}, {"user": "u9"}))
    assert cloud.last.body["user_id"] == "u9"


async def test_mcp_server_matches_typescript(cloud: FakeCloud, library: dict[str, Any]) -> None:
    server = board(cloud, "async", library).mcp_server({"user_id": "u1", "group_ids": ["g1"]})
    async with Client(server) as client:
        assert client.instructions == COPY["mcp_instructions"]
        listed = await client.list_tools()
        assert [
            t.model_dump(mode="json", by_alias=True, exclude_none=True) for t in listed.tools
        ] == COPY["mcp_tools"]

        created = await client.call_tool("create_dashboard", {"title": "Q3", "prompt": "Sales"})
        assert created.content[0].text == "[dashboard art_1] Sales"
        assert len(created.content) == 2 and not created.is_error

        missing = await client.call_tool("delete_dashboard", {"id": "art_1"})
        assert missing.is_error
        assert (
            missing.content[0].text
            == 'Unknown tool "delete_dashboard". Use create_dashboard, edit_dashboard or get_dashboard.'
        )


async def test_mcp_server_resolves_the_user_per_request(
    cloud: FakeCloud, library: dict[str, Any]
) -> None:
    server = board(cloud, "async", library).mcp_server(
        lambda request: None if request is None else {"user_id": "u1"}
    )
    async with Client(server) as client:  # In process there's no HTTP request, so no user.
        refused = await client.call_tool("create_dashboard", {"title": "t", "prompt": "p"})
    assert refused.is_error and refused.content[0].text == "No signed-in user for this request."
    assert not [s for s in cloud.sent if s.path == ROUTE]


def orders_server() -> MCPServer:
    server = MCPServer("orders")

    @server.tool(name="list-orders", annotations=ToolAnnotations(read_only_hint=True))
    def list_orders(status: str = "open", limit: int = 10) -> dict[str, Any]:
        """List orders"""
        return {"status": status, "limit": limit}

    @server.tool(name="get.order", annotations=ToolAnnotations(read_only_hint=True))
    def get_order(order_id: str) -> dict[str, Any]:
        """One order"""
        if order_id == "bad":
            raise ValueError("no such order")
        return {"id": order_id}

    @server.tool(name="delete_order")
    def delete_order(order_id: str) -> str:
        return "deleted"

    return server


async def test_mcp_data_tools_offer_read_only_tools(
    cloud: FakeCloud, library: dict[str, Any]
) -> None:
    cloud.on("POST", ROUTE, {"choices": [{"finish_reason": "stop", "message": {"content": "ok"}}]})
    async with Client(orders_server()) as session:
        openui = cloud.client("async")
        dashboards = openui.define_dashboard(library=library, model="m", mcp=session)
        tools = await dashboards.tools({"user_id": "u1"})
        listed = tools["create_dashboard"].description.split(
            "Dashboards can show this data, and nothing else:\n"
        )[1]
        # In the order the server lists them, with names cleaned up for generation.
        assert listed.splitlines() == ["- list_orders: List orders", "- get_order: One order"]

        context = {"user_id": "u1"}
        result = await dashboards.interpreter.execute(
            {"name": "list_orders", "arguments": {"status": "", "limit": 2}}, context
        )
        assert result == {"status": "open", "limit": 2}  # An empty optional filter is left out.
        with pytest.raises(ToolExecutionError) as error:
            await dashboards.interpreter.execute(
                {"name": "get_order", "arguments": {"order_id": "bad"}}, context
            )
        assert error.value.code == "tool_exec_error"
        with pytest.raises(ToolExecutionError) as error:
            await dashboards.interpreter.execute({"name": "delete_order", "arguments": {}}, context)
        assert error.value.code == "tool_not_found"


async def test_mcp_config_picks_tools_and_connects_per_user(
    cloud: FakeCloud, library: dict[str, Any]
) -> None:
    calls: list[tuple[str, str]] = []

    class Legacy:
        """An MCP 1.x-style client: camelCase fields, a paginated listing."""

        def __init__(self, user: str) -> None:
            self.user = user

        async def list_tools(self, *, params: Any = None) -> dict[str, Any]:
            if params is None:
                return {
                    "tools": [{"name": "a", "inputSchema": {"type": "object"}}],
                    "nextCursor": "p2",
                }
            return {"tools": [{"name": "9b", "inputSchema": {"type": "object"}}]}

        async def call_tool(
            self, name: str, arguments: dict[str, Any] | None = None
        ) -> dict[str, Any]:
            calls.append((self.user, name))
            return {"content": [{"type": "text", "text": '{"n":1}'}], "isError": False}

    async def connect(context: Any) -> Legacy:
        return Legacy(context["user_id"])

    config = McpConfig(client=Legacy("org"), include=lambda tool: True, connect=connect)
    dashboards = cloud.client("async").define_dashboard(library=library, model="m", mcp=[config])
    assert await dashboards.interpreter.execute({"name": "_9b"}, {"user_id": "u7"}) == {"n": 1}
    assert calls == [("u7", "9b")]
