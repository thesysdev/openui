"""Dashboards: the build loop, streamed builds and the interpreter."""

from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
import pytest
from support import GOLDEN, FakeCloud, drain, settle, sse

from openui_server import DataTool, OpenUIApiError, ToolExecutionError

ROUTE = "/v1/dashboard/chat/completions"
EXECUTE = "/v1/app/execute"


def started(text: str = "[dashboard art_1] started") -> dict[str, Any]:
    return {"choices": [{"finish_reason": "stop", "message": {"content": text}}]}


def tool_calls(*calls: tuple[str, str, str]) -> dict[str, Any]:
    return {
        "artifact_id": "art_1",
        "artifact_version": "v1",
        "choices": [
            {
                "finish_reason": "tool_calls",
                "message": {
                    "tool_calls": [
                        {
                            "id": id,
                            "type": "function",
                            "function": {"name": name, "arguments": args},
                        }
                        for id, name, args in calls
                    ]
                },
            }
        ],
    }


def sales_tool(kind: str) -> DataTool:
    if kind == "sync":

        def get_sales(args: dict[str, Any], context: Any) -> dict[str, Any]:
            return {"rows": args, "user": context["user_id"]}

        return DataTool(
            description="Sales by region", parameters={"type": "object"}, execute=get_sales
        )

    async def get_sales_async(args: dict[str, Any], context: Any) -> dict[str, Any]:
        return {"rows": args, "user": context["user_id"]}

    return DataTool(
        description="Sales by region", parameters={"type": "object"}, execute=get_sales_async
    )


def dashboards(cloud: FakeCloud, kind: str, library: dict[str, Any], **options: Any) -> Any:
    openui = cloud.client(kind, app_id="app1")
    options.setdefault("tools", {"get_sales": sales_tool(kind)})
    return openui.define_dashboard(library=library, model="anthropic/claude-sonnet-4.6", **options)


async def test_first_request_matches_typescript(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    async def get_sales(args: dict[str, Any], context: Any) -> None: ...

    tool = DataTool(
        description="Sales by region",
        parameters={"type": "object", "properties": {"region": {"type": "string"}}},
        output={"rows": []},
        execute=get_sales if kind == "async" else lambda args, context: None,
    )
    cloud.on("POST", ROUTE, started())
    board = dashboards(
        cloud,
        kind,
        library,
        tools={"get_sales": tool},
        reasoning_effort="low",
        max_tool_rounds=3,
        prompt_options={
            "examples": ["root = Stack([])"],
            "preamble": "",
            "additional_rules": ["Be brief"],
        },
    )
    context = {"user_id": "u1", "group_ids": ["g1"], "team": "blue"}
    assert (
        await settle(board.create(title="Q3", prompt="Sales", context=context))
        == "[dashboard art_1] started"
    )
    # The config block is compared as a string: it must be the bytes TypeScript sends.
    assert cloud.last.body == GOLDEN["dashboard"]["first_request"]


async def test_tool_rounds_run_tools_and_saved_scripts(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    cloud.on(
        "POST",
        ROUTE,
        tool_calls(
            ("t1", "get_sales", '{"region":"EMEA"}'),
            ("t2", "openui_create_script", '{"name":"q1","code":"…","args":{"x":1}}'),
            ("t3", "nope", "{}"),
            ("t4", "get_sales", "[1]"),
        ),
        started(),
    )
    cloud.on(
        "POST",
        EXECUTE,
        {
            "status": "tool_calls",
            "state": "s1",
            "calls": [{"call_id": "k1", "name": "get_sales", "arguments": '{"r":1}'}],
        },
        {"status": "done", "result": {"total": 42}},
    )
    board = dashboards(cloud, kind, library)
    await settle(board.create(title="Q3", prompt="Sales", context={"user_id": "u1"}))

    round_two = [s for s in cloud.sent if s.path == ROUTE][1].body
    assert round_two["artifact_id"] == "art_1"
    assert [m["content"] for m in round_two["messages"]] == [
        '{"rows":{"region":"EMEA"},"user":"u1"}',
        '{"total":42}',
        '{"error":{"code":"tool_not_found","message":"Unknown tool: nope"}}',
        '{"error":{"code":"bad_args","message":"Tool arguments must be a JSON object"}}',
    ]
    script = [s for s in cloud.sent if s.path == EXECUTE]
    assert script[0].body == {
        "artifact_id": "art_1",
        "artifact_version": "v1",
        "user_id": "u1",
        "app_id": "app1",
        "name": "q1",
        "arguments": {"x": 1},
        "tool_results": [],
    }
    assert script[1].body["state"] == "s1"
    assert script[1].body["tool_results"] == [
        {"type": "function_call_output", "call_id": "k1", "output": '{"rows":{"r":1},"user":"u1"}'}
    ]


async def test_edit_sends_groups_and_a_new_build_does_not(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    cloud.on("POST", ROUTE, started())
    board = dashboards(cloud, kind, library)
    context = {"user_id": "u1", "group_ids": ["g1"]}
    await settle(board.create(title="Q3", prompt="Sales", context=context))
    await settle(board.edit(id="art_1", prompt="More", context=context))
    assert "group_ids" not in cloud.sent[0].body
    assert cloud.sent[1].body["group_ids"] == ["g1"]


async def test_streamed_build_yields_messages_and_gathers_tool_calls(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    first = [
        {
            "artifact_id": "art_2",
            "artifact_version": "v1",
            "choices": [{"delta": {"content": "Building art_2"}}],
        },
        {
            "choices": [
                {
                    "delta": {
                        "tool_calls": [
                            {
                                "index": 0,
                                "id": "t1",
                                "function": {"name": "get_", "arguments": '{"reg'},
                            }
                        ]
                    }
                }
            ]
        },
        {
            "choices": [
                {
                    "delta": {
                        "tool_calls": [
                            {"index": 0, "function": {"name": "sales", "arguments": 'ion":"EU"}'}}
                        ]
                    }
                }
            ]
        },
        {"choices": [{"delta": {}, "finish_reason": "tool_calls"}]},
    ]
    second = [{"choices": [{"delta": {"content": "Saved art_2"}, "finish_reason": "stop"}]}]
    cloud.on("POST", ROUTE, lambda _: sse(*first), lambda _: sse(*second))
    board = dashboards(cloud, kind, library)
    messages = await drain(
        board.create(title="Q4", prompt="Costs", context={"user_id": "u1"}, stream=True)
    )
    assert messages == ["Building art_2", "Saved art_2"]
    assert cloud.sent[0].body["stream"] is True
    assert cloud.sent[1].body["messages"] == [
        {"role": "tool", "tool_call_id": "t1", "content": '{"rows":{"region":"EU"},"user":"u1"}'}
    ]


async def test_a_build_needs_a_user(cloud: FakeCloud, kind: str, library: dict[str, Any]) -> None:
    board = dashboards(cloud, kind, library)
    with pytest.raises(ToolExecutionError) as error:
        await settle(board.create(title="Q3", prompt="Sales", context={"group_ids": []}))
    assert error.value.code == "invalid_input"


@pytest.mark.parametrize(
    ("options", "code"),
    [
        ({"model": ""}, "invalid_input"),
        ({"library": {"schema": {}}}, "invalid_input"),
        ({"tools": None}, "invalid_input"),
        ({"library": {"components": {}, "schema": {"$defs": {}}}}, "invalid_library"),
    ],
)
def test_define_dashboard_checks_its_options(
    library: dict[str, Any], options: dict[str, Any], code: str
) -> None:
    from openui_server import OpenUIClient

    arguments = {"library": library, "model": "m", "tools": {}, **options}
    with pytest.raises(OpenUIApiError) as error:
        OpenUIClient(api_key="k").define_dashboard(**arguments)
    assert error.value.code == code


async def test_interpreter_runs_a_tool_by_name(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    board = dashboards(cloud, kind, library)
    result = await settle(
        board.interpreter.execute({"name": "get_sales", "arguments": {"r": 1}}, {"user_id": "u1"})
    )
    assert result == {"rows": {"r": 1}, "user": "u1"}
    assert cloud.sent == []


@pytest.mark.parametrize(
    ("responses", "code"),
    [
        (
            [{"status": "error", "error": {"code": "script_error", "message": "boom"}}],
            "script_error",
        ),
        (
            [
                {
                    "status": "tool_calls",
                    "state": "s",
                    "calls": [
                        {"call_id": "a", "name": "x", "arguments": "{}"},
                        {"call_id": "a", "name": "x", "arguments": "{}"},
                    ],
                }
            ],
            "invalid_response",
        ),
        ([{"status": "weird"}], "invalid_response"),
        (
            [
                {
                    "status": "tool_calls",
                    "state": "s",
                    "calls": [{"call_id": f"c{i}", "name": "get_sales", "arguments": "{}"}],
                }
                for i in range(9)
            ],
            "script_limit",
        ),
    ],
)
async def test_interpreter_script_runs_fail_safely(
    cloud: FakeCloud, kind: str, library: dict[str, Any], responses: list[dict[str, Any]], code: str
) -> None:
    cloud.on("POST", EXECUTE, *responses)
    board = dashboards(cloud, kind, library)
    with pytest.raises(ToolExecutionError) as error:
        await settle(board.interpreter.execute({"name": "q1", "id": "art_1"}, {"user_id": "u1"}))
    assert (error.value.code, error.value.status) == (code, 502)


async def test_interpreter_maps_cloud_errors(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    cloud.on(
        "POST",
        EXECUTE,
        httpx.Response(409, json={"error": {"code": "stale", "message": "Old version"}}),
    )
    board = dashboards(cloud, kind, library)
    with pytest.raises(ToolExecutionError) as error:
        await settle(board.interpreter.execute({"name": "q1", "id": "art_1"}, {"user_id": "u1"}))
    assert (error.value.code, error.value.status) == ("stale", 409)


async def test_a_script_needs_the_artifact_id(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    board = dashboards(cloud, kind, library)
    with pytest.raises(ToolExecutionError) as error:
        await settle(board.interpreter.execute({"name": "q1"}, {"user_id": "u1"}))
    assert (error.value.code, error.value.status) == ("tool_not_found", 404)


async def test_async_interpreter_times_out(cloud: FakeCloud, library: dict[str, Any]) -> None:
    async def slow(args: dict[str, Any], context: Any) -> None:
        await asyncio.sleep(2)

    board = dashboards(
        cloud, "async", library, tools={"slow": DataTool(parameters={}, execute=slow)}
    )
    started_at = time.monotonic()
    with pytest.raises(ToolExecutionError) as error:
        await board.interpreter.execute({"name": "slow"}, {"user_id": "u1"}, timeout=0.1)
    assert (error.value.code, error.value.status) == ("tool_timeout", 504)
    assert time.monotonic() - started_at < 1


async def test_async_client_runs_a_plain_tool_off_the_event_loop(
    cloud: FakeCloud, library: dict[str, Any]
) -> None:
    def blocking(args: dict[str, Any], context: Any) -> int:
        time.sleep(0.3)
        return 1

    board = dashboards(
        cloud, "async", library, tools={"blocking": DataTool(parameters={}, execute=blocking)}
    )
    ticks = 0

    async def ticker() -> None:
        nonlocal ticks
        for _ in range(5):
            await asyncio.sleep(0.03)
            ticks += 1

    await asyncio.gather(
        board.interpreter.execute({"name": "blocking"}, {"user_id": "u1"}), ticker()
    )
    assert ticks == 5


def test_sync_interpreter_checks_its_deadline(cloud: FakeCloud, library: dict[str, Any]) -> None:
    def slow(args: dict[str, Any], context: Any) -> int:
        time.sleep(0.2)
        return 1

    board = dashboards(
        cloud, "sync", library, tools={"slow": DataTool(parameters={}, execute=slow)}
    )
    with pytest.raises(ToolExecutionError) as error:
        board.interpreter.execute({"name": "slow"}, {"user_id": "u1"}, timeout=0.05)
    assert error.value.code == "tool_timeout"


def test_sync_client_refuses_an_async_tool(cloud: FakeCloud, library: dict[str, Any]) -> None:
    async def tool(args: dict[str, Any], context: Any) -> int:
        return 1

    board = dashboards(
        cloud, "sync", library, tools={"tool": DataTool(parameters={}, execute=tool)}
    )
    with pytest.raises(ToolExecutionError) as error:
        board.interpreter.execute({"name": "tool"}, {"user_id": "u1"})
    assert error.value.code == "invalid_tools"


async def test_get_reads_as_the_user(cloud: FakeCloud, kind: str, library: dict[str, Any]) -> None:
    cloud.on(
        "GET",
        "/v1/artifacts/art_1",
        {"id": "art_1", "kind": "dashboard", "content": "x", "pinned": False, "created_at": 1},
    )
    board = dashboards(cloud, kind, library)
    await settle(board.get(id="art_1", context={"user_id": "u1", "group_ids": ["g1"]}))
    assert cloud.last.query == {"user_id": ["u1"], "group_ids": ["g1"], "app_id": ["app1"]}
