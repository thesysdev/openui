"""Runs data tools and generated scripts (`interpreter/execute.ts`). `ScriptRun` holds every rule;
the sync and async interpreters only send requests and run tools."""

from __future__ import annotations

import asyncio
import inspect
import time
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from typing import Any

import httpx

from ..core.act_as import acting_user
from ..core.errors import OpenUIApiError
from ..core.http import AsyncHttp, JsonObject, SyncHttp, json_text
from .types import (
    DataTool,
    ExecutionContext,
    InterpreterRequest,
    ToolExecutionError,
    assert_context,
    async_tool,
    code_of,
    object_args,
    timed_out,
    unknown_tool,
)

# Rounds of calls a script run may wait on. Only this package counts them.
MAX_ROUNDS = 8


MAX_TOOL_CALLS = 256


DEFAULT_EXECUTE_TIMEOUT = 60.0


def tool_definitions(tools: Mapping[str, DataTool]) -> list[JsonObject]:
    """What generation sees of your tools: everything but `execute`."""
    definitions: list[JsonObject] = []
    for name, tool in tools.items():
        definition: JsonObject = {"name": name, "parameters": tool.parameters}
        if tool.description is not None:
            definition["description"] = tool.description
        if tool.output is not None:
            definition["output"] = tool.output
        definitions.append(definition)
    return definitions


@dataclass(frozen=True, slots=True)
class Execution:
    """A checked interpreter request."""

    name: str
    arguments: dict[str, Any]
    id: str | None
    version: str | None
    timeout: float


def check_execution(request: Any, context: Any, timeout: float | None) -> Execution:
    assert_context(context)
    name = request.get("name") if isinstance(request, Mapping) else None
    if not isinstance(name, str) or not name:
        raise ToolExecutionError("A tool name is required", "invalid_input")
    args = request.get("arguments")
    if args is None:
        args = {}
    if not isinstance(args, dict):
        raise ToolExecutionError("Tool arguments must be an object", "invalid_input")
    timeout = DEFAULT_EXECUTE_TIMEOUT if timeout is None else timeout
    if not isinstance(timeout, int | float) or not 0 < timeout < float("inf"):
        raise ToolExecutionError("timeout must be a positive finite number", "invalid_input")
    id, version = request.get("id"), request.get("version")
    return Execution(
        name=name,
        arguments=args,
        id=id if isinstance(id, str) and id else None,
        version=version if isinstance(version, str) and version else None,
        timeout=float(timeout),
    )


class Deadline:
    """The sync interpreter's budget: checked between calls, since a running tool can't be
    stopped."""

    def __init__(self, seconds: float) -> None:
        self._end = time.monotonic() + seconds

    def remaining(self) -> float:
        left = self._end - time.monotonic()
        if left <= 0:
            raise timed_out()
        return left


def _invalid_script_response() -> ToolExecutionError:
    return ToolExecutionError("Invalid script execution response", "invalid_response", 502)


def script_limit() -> ToolExecutionError:
    return ToolExecutionError("Script execution limit exceeded", "script_limit", 502)


@dataclass(frozen=True, slots=True)
class ScriptDone:
    result: Any


class ScriptRun:
    """A generated script's run, round by round: send `body`, then either it's done, or run the
    calls `read` returns and pass their results to `answer`."""

    def __init__(self, execution: Execution, context: ExecutionContext, app_id: str | None):
        if execution.id is None:
            raise ToolExecutionError(
                f"Unknown tool: {execution.name}. Send the artifact's id to run its scripts.",
                "tool_not_found",
                404,
            )
        # Only users who can open the artifact can run its scripts: its owner, or anyone it's
        # shared with.
        self._source: JsonObject = {"artifact_id": execution.id}
        if execution.version is not None:
            self._source["artifact_version"] = execution.version
        self._source.update(acting_user(context))
        if app_id is not None:
            self._source["app_id"] = app_id
        self._source.update(name=execution.name, arguments=execution.arguments)
        self._state: str | None = None
        self._results: list[JsonObject] = []
        self._seen: set[str] = set()
        self._round = 0

    @property
    def body(self) -> JsonObject:
        body = {**self._source, "tool_results": self._results}
        if self._state is not None:
            body["state"] = self._state
        return body

    def read(self, response: JsonObject) -> ScriptDone | list[JsonObject]:
        status = response.get("status")
        if status == "done":
            return ScriptDone(response.get("result"))
        if status == "error":
            error = response.get("error")
            if (
                not isinstance(error, dict)
                or not isinstance(error.get("code"), str)
                or not isinstance(error.get("message"), str)
            ):
                raise _invalid_script_response()
            # Never replay tools after a failed snapshot: a prior call may have mutated data.
            # The script failed upstream, not the caller's request: a bad gateway.
            raise ToolExecutionError(error["message"], error["code"], 502)
        calls, state = response.get("calls"), response.get("state")
        if (
            status != "tool_calls"
            or not isinstance(state, str)
            or not state
            or not isinstance(calls, list)
            or not calls
        ):
            raise _invalid_script_response()
        if self._round == MAX_ROUNDS or len(self._seen) + len(calls) > MAX_TOOL_CALLS:
            raise script_limit()
        # Check the whole batch before any of your tools starts.
        for call in calls:
            if (
                not isinstance(call, dict)
                or call.get("type") not in (None, "function_call")
                or not isinstance(call.get("call_id"), str)
                or not call["call_id"]
                or call["call_id"] in self._seen
                or not isinstance(call.get("name"), str)
                or not call["name"]
                or not isinstance(call.get("arguments"), str)
            ):
                raise _invalid_script_response()
            self._seen.add(call["call_id"])
        self._state = state
        self._round += 1
        return calls

    def answer(self, results: list[JsonObject]) -> None:
        self._results = results


def call_output(call_id: str, result: Any) -> JsonObject:
    try:
        output = json_text(result)
    except (TypeError, ValueError):
        raise ToolExecutionError(
            "Tool result must be JSON serializable", "bad_tool_result"
        ) from None
    return {"type": "function_call_output", "call_id": call_id, "output": output}


def call_failure(call_id: str, error: Exception) -> JsonObject:
    return {"call_id": call_id, "error": {"code": code_of(error), "message": str(error)}}


def api_failure(error: Exception) -> Exception:
    """An OpenUI Cloud failure during a script run surfaces as a tool error, with the same code
    and status."""
    if isinstance(error, OpenUIApiError):
        return ToolExecutionError(error.message, error.code, error.status)
    return error


EXECUTE_ROUTE = "/v1/app/execute"


class Interpreter:
    """Runs a dashboard's data tools and generated scripts on your server. Call `execute` from
    the route your renderer sends data tool calls to."""

    def __init__(self, http: SyncHttp, tools: Mapping[str, DataTool]) -> None:
        self._http, self._tools = http, tools

    def execute(
        self,
        request: InterpreterRequest | Mapping[str, Any],
        context: ExecutionContext,
        *,
        timeout: float | None = None,
    ) -> Any:
        """Runs one call: a data tool by name, or one of the dashboard's scripts by the
        artifact's `id`. `context` reaches your tools as is. Scripts run only for users who can
        open the artifact. `timeout` (seconds, default 60) is checked between tool calls: a
        running sync tool can't be stopped."""
        execution = check_execution(request, context, timeout)
        deadline = Deadline(execution.timeout)
        if execution.name in self._tools:
            return self._dispatch(execution.name, execution.arguments, context, deadline)
        # Generated scripts run from the artifact OpenUI Cloud stores.
        run = ScriptRun(execution, context, self._http.cloud.app_id)
        while True:
            try:
                response = self._http.send(
                    "POST", EXECUTE_ROUTE, body=run.body, timeout=deadline.remaining()
                )
            except httpx.TimeoutException:
                raise timed_out() from None
            except OpenUIApiError as error:
                raise api_failure(error) from error
            step = run.read(response)
            if isinstance(step, ScriptDone):
                return step.result
            results: list[JsonObject] = []
            for call in step:
                try:
                    args = object_args(call["arguments"])
                    result = self._dispatch(call["name"], args, context, deadline)
                    results.append(call_output(call["call_id"], result))
                except Exception as error:
                    deadline.remaining()  # Out of time ends the run, not just this call.
                    results.append(call_failure(call["call_id"], error))
            run.answer(results)

    def _dispatch(
        self, name: str, args: dict[str, Any], context: ExecutionContext, deadline: Deadline
    ) -> Any:
        deadline.remaining()
        tool = self._tools.get(name)
        if tool is None or not callable(tool.execute):
            raise unknown_tool(name)
        result = tool.execute(args, context)
        if inspect.isawaitable(result):
            if inspect.iscoroutine(result):
                result.close()
            raise async_tool(name)
        deadline.remaining()
        return result


async def _dispatch(
    tools: Mapping[str, DataTool], name: str, args: dict[str, Any], context: ExecutionContext
) -> Any:
    tool = tools.get(name)
    if tool is None or not callable(tool.execute):
        raise unknown_tool(name)
    # A plain `def` tool runs in a thread, so it doesn't block the event loop.
    if inspect.iscoroutinefunction(tool.execute):
        result = await tool.execute(args, context)
    else:
        result = await asyncio.to_thread(tool.execute, args, context)
    return await result if inspect.isawaitable(result) else result


class AsyncInterpreter:
    """`Interpreter`, for `AsyncOpenUIClient`: tools may be `async def`, and a round's calls run
    together."""

    def __init__(
        self, http: AsyncHttp, load_tools: Callable[[], Awaitable[dict[str, DataTool]]]
    ) -> None:
        self._http, self._load_tools = http, load_tools

    async def execute(
        self,
        request: InterpreterRequest | Mapping[str, Any],
        context: ExecutionContext,
        *,
        timeout: float | None = None,
    ) -> Any:
        """Runs one call: a data tool by name, or one of the dashboard's scripts by the
        artifact's `id`. `context` reaches your tools as is. Scripts run only for users who can
        open the artifact. The whole run, your tools included, gets `timeout` seconds
        (default 60)."""
        execution = check_execution(request, context, timeout)
        scope = asyncio.timeout(execution.timeout)
        try:
            async with scope:
                return await self._run(execution, context)
        except TimeoutError:
            if scope.expired():
                raise timed_out() from None
            raise

    async def _run(self, execution: Execution, context: ExecutionContext) -> Any:
        tools = await self._load_tools()
        if execution.name in tools:
            return await _dispatch(tools, execution.name, execution.arguments, context)
        # Generated scripts run from the artifact OpenUI Cloud stores.
        run = ScriptRun(execution, context, self._http.cloud.app_id)
        while True:
            try:
                response = await self._http.send("POST", EXECUTE_ROUTE, body=run.body)
            except OpenUIApiError as error:
                raise api_failure(error) from error
            step = run.read(response)
            if isinstance(step, ScriptDone):
                return step.result
            run.answer(list(await asyncio.gather(*(self._call(tools, c, context) for c in step))))

    @staticmethod
    async def _call(
        tools: Mapping[str, DataTool], call: JsonObject, context: ExecutionContext
    ) -> JsonObject:
        try:
            args = object_args(call["arguments"])
            return call_output(call["call_id"], await _dispatch(tools, call["name"], args, context))
        except Exception as error:
            return call_failure(call["call_id"], error)
