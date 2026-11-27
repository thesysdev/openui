"""`openui.define_dashboard` (`artifacts/dashboards/index.ts`). `Build` holds every rule of a
build; the sync and async dashboards only send requests and run tools."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Awaitable, Callable, Iterator, Mapping
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal, overload

from ...core.act_as import acting_user
from ...core.cloud_config import PromptOptions
from ...core.errors import OpenUIApiError, invalid_input
from ...core.http import AsyncHttp, JsonObject, SyncHttp, json_text
from ...interpreter.execute import AsyncInterpreter, Interpreter, tool_definitions
from ...interpreter.types import DataTool, ExecutionContext, ToolExecutionError, assert_context
from .. import ArtifactCalls
from ..types import Artifact
from .config import artifact_config
from .dashboard_mcp import dashboard_mcp_server
from .dashboard_tools import (
    AsyncDashboardTool,
    DashboardTool,
    ToolUser,
    async_dashboard_tools,
    dashboard_tools,
)
from .tool_round import round_request, tool_error_content, tool_message
from .types import ReasoningEffort

if TYPE_CHECKING:
    from mcp.server.lowlevel import Server

# OpenUI Cloud's route that builds and edits dashboards, round by round.
DASHBOARD_ROUTE = "/v1/dashboard/chat/completions"


@dataclass(frozen=True, slots=True)
class Options:
    """A dashboard's settings, checked once when it's defined."""

    model: str
    reasoning_effort: ReasoningEffort | None
    max_tool_rounds: int | None
    config: Callable[[dict[str, Any]], str]
    app_id: str | None


def check_options(
    *,
    library: Any,
    model: Any,
    has_tools: bool,
    reasoning_effort: ReasoningEffort | None,
    max_tool_rounds: int | None,
    prompt_options: PromptOptions | None,
    app_id: str | None,
) -> Options:
    if not isinstance(model, str) or not model.strip():
        raise invalid_input(
            "model is required, as `provider/model`, such as anthropic/claude-sonnet-4.6"
        )
    if not isinstance(library, Mapping) or not isinstance(library.get("components"), Mapping):
        raise invalid_input(
            "library is required as a library spec: the JSON `openui generate --spec` writes"
        )
    if not has_tools:
        raise invalid_input("Dashboards need data tools: pass `tools`, `mcp`, or both")
    try:
        config = artifact_config(library, prompt_options)
    except ValueError as error:
        raise OpenUIApiError(str(error), "invalid_library") from None
    return Options(model, reasoning_effort, max_tool_rounds, config, app_id)


def _not_started() -> OpenUIApiError:
    return OpenUIApiError(
        "OpenUI Cloud didn't start a background artifact", "invalid_response", 502
    )


def _first_choice(event: JsonObject) -> JsonObject | None:
    choices = event.get("choices")
    choice = choices[0] if isinstance(choices, list) and choices else None
    return choice if isinstance(choice, dict) else None


class Build:
    """One dashboard build, round by round. Each round sends `request()`; the reply either says
    the dashboard started, or holds tool calls whose results go back with `answer()`. OpenUI
    Cloud keeps the build's turns, so each later round sends only the new results."""

    def __init__(
        self,
        options: Options,
        context: ExecutionContext,
        prompt: str,
        definitions: list[JsonObject],
        *,
        title: str | None = None,
        id: str | None = None,
    ) -> None:
        # The dashboard belongs to the user the context names, in the client's app if it has
        # one, as a frontend token minted for them would say.
        assert_context(context)
        self.context = context
        self._options = options
        # An edit can come from a share to one of the user's groups; a new dashboard is the
        # user's alone.
        self._edit = id is not None
        # Everything rides in the config block: tools and title for generation, the artifact an
        # edit changes for OpenUI Cloud. The model may call these data tools, and
        # openui_create_script, whose saved scripts this server runs.
        artifact: JsonObject = {"tools": definitions}
        if title is not None:
            artifact["title"] = title
        if id is not None:
            artifact["id"] = id
        if options.max_tool_rounds is not None:
            artifact["maxToolRounds"] = options.max_tool_rounds
        self._messages: list[JsonObject] = [
            {"role": "system", "content": options.config(artifact)},
            {"role": "user", "content": prompt},
        ]
        # The dashboard's id, from the first tool-call reply: later rounds and saved scripts go
        # by it. The build's version, from the same reply: a saved script runs from it.
        self.artifact_id: str | None = None
        self.version: str | None = None
        self.calls: list[JsonObject] = []
        self._streamed: dict[int, JsonObject] = {}
        self._finish: Any = None

    def request(self) -> JsonObject:
        body: JsonObject = {"model": self._options.model, "messages": self._messages}
        if self.artifact_id is not None:
            body["artifact_id"] = self.artifact_id
        if self._options.reasoning_effort is not None:
            body["reasoning_effort"] = self._options.reasoning_effort
        user = acting_user(self.context)
        body["user_id"] = user["user_id"]
        if self._edit and "group_ids" in user:
            body["group_ids"] = user["group_ids"]
        if self._options.app_id is not None:
            body["app_id"] = self._options.app_id
        return body

    def read(self, reply: JsonObject) -> str | None:
        """The tool response once the dashboard started; else None, with `calls` to run."""
        choice = _first_choice(reply)
        message = choice.get("message") if choice else None
        if (
            choice
            and choice.get("finish_reason") == "stop"
            and isinstance(message, dict)
            and isinstance(message.get("content"), str)
            and message["content"]
        ):
            return str(message["content"])
        calls = message.get("tool_calls") if isinstance(message, dict) else None
        artifact_id, version = reply.get("artifact_id"), reply.get("artifact_version")
        if not isinstance(calls, list) or not calls or not isinstance(artifact_id, str):
            raise _not_started()
        self.calls, self.artifact_id = calls, artifact_id
        self.version = version if isinstance(version, str) else None
        return None

    def start_stream(self) -> None:
        self._streamed, self._finish = {}, None

    def feed(self, chunk: JsonObject) -> str | None:
        """One streamed event: the text to yield, if it has any."""
        if isinstance(chunk.get("artifact_id"), str):
            self.artifact_id = chunk["artifact_id"]
        if isinstance(chunk.get("artifact_version"), str):
            self.version = chunk["artifact_version"]
        choice = _first_choice(chunk)
        if choice is None:
            return None
        delta: JsonObject = choice["delta"] if isinstance(choice.get("delta"), dict) else {}
        for part in delta.get("tool_calls") or []:
            index = part.get("index")
            call = self._streamed.setdefault(
                index if isinstance(index, int) else len(self._streamed),
                {"id": "", "function": {"name": "", "arguments": ""}},
            )
            call["id"] = call["id"] or part.get("id") or ""
            function = part.get("function") or {}
            call["function"]["name"] += function.get("name") or ""
            call["function"]["arguments"] += function.get("arguments") or ""
        if choice.get("finish_reason"):
            self._finish = choice["finish_reason"]
        content = delta.get("content")
        return content if isinstance(content, str) and content else None

    def end_stream(self) -> bool:
        """True once the build is done; False with `calls` to run."""
        if self._finish == "stop":
            return True
        if self._finish is None:
            raise OpenUIApiError(
                "OpenUI Cloud's stream ended before the build did", "invalid_response", 502
            )
        self.calls = [self._streamed[index] for index in sorted(self._streamed)]
        if self._finish != "tool_calls" or not self.calls or self.artifact_id is None:
            raise _not_started()
        return False

    def round_request(self, call: JsonObject, tools: Mapping[str, DataTool]) -> JsonObject:
        assert self.artifact_id is not None
        return round_request(call, tools, self.artifact_id, self.version)

    def answer(self, tool_messages: list[JsonObject]) -> None:
        self._messages = tool_messages


class Dashboard:
    """Creates, edits and reads live dashboards. `create` and `edit` first run the model's tool
    rounds against your tools (typically 20-45 s), then return, once the dashboard starts
    generating, the tool response: return it from your tool as is, and pass it to the renderer.
    A plain call doesn't report a failure after that point.

    With `stream=True` they yield two messages instead: one as soon as the dashboard has an id
    (render it from then on), and the last once it's saved or failed, saying which. Each carries
    the dashboard's reference; return the last one to your model."""

    def __init__(self, http: SyncHttp, options: Options, tools: Mapping[str, DataTool]) -> None:
        self._http, self._options, self._tools = http, options, tools
        self.interpreter = Interpreter(http, tools)
        """Runs this dashboard's data tools and generated scripts on your server."""

    @overload
    def create(
        self,
        *,
        title: str,
        prompt: str,
        context: ExecutionContext,
        stream: Literal[False] = False,
    ) -> str: ...
    @overload
    def create(
        self, *, title: str, prompt: str, context: ExecutionContext, stream: Literal[True]
    ) -> Iterator[str]: ...
    def create(
        self, *, title: str, prompt: str, context: ExecutionContext, stream: bool = False
    ) -> str | Iterator[str]:
        """Builds a dashboard for `context["user_id"]`. Until they share it, only they can read,
        edit and run it. `prompt` is all the model sees, so include any data it needs."""
        build = self._build(context, prompt, title=title)
        return self._streamed(build) if stream else self._start(build)

    @overload
    def edit(
        self,
        *,
        id: str,
        prompt: str,
        context: ExecutionContext,
        stream: Literal[False] = False,
    ) -> str: ...
    @overload
    def edit(
        self, *, id: str, prompt: str, context: ExecutionContext, stream: Literal[True]
    ) -> Iterator[str]: ...
    def edit(
        self, *, id: str, prompt: str, context: ExecutionContext, stream: bool = False
    ) -> str | Iterator[str]:
        """Edits it in place, for its owner or anyone it's shared with for editing. Renderers
        keep the current version until the edit is ready."""
        if not isinstance(id, str) or not id:
            raise invalid_input("id is required")
        build = self._build(context, prompt, id=id)
        return self._streamed(build) if stream else self._start(build)

    def get(self, *, id: str, context: ExecutionContext) -> Artifact:
        """Reads a dashboard the user can open: their own, or one shared with them. Give the
        model its `name` and `content`, or the renderer its `id`. Always as the user, never the
        org: the model picks the id."""
        assert_context(context)
        calls = ArtifactCalls(self._options.app_id)
        return self._http.call(calls.get(id, context["user_id"], context.get("group_ids")))

    def tools(self, context: ToolUser) -> dict[str, DashboardTool]:
        """`create_dashboard`, `edit_dashboard` and `get_dashboard` for agent frameworks, as
        `context`'s user, or a function that finds the user from the framework's call context on
        each call. We own the names, descriptions and schemas: the descriptions carry the rules
        (no numbers in prompts, edit over create, a one-sentence reply). Each tool has `name`,
        `description`, `input_schema` (JSON Schema) and `execute(input, call_context=None)`."""
        return dashboard_tools(self, tool_definitions(self._tools), context)

    def _build(self, context: ExecutionContext, prompt: str, **call: str) -> Build:
        return Build(self._options, context, prompt, tool_definitions(self._tools), **call)

    def _run_round(self, build: Build) -> list[JsonObject]:
        messages = []
        for call in build.calls:
            try:
                result = self.interpreter.execute(
                    build.round_request(call, self._tools), build.context
                )
                content = json_text(result)
            except Exception as error:
                content = tool_error_content(error)
            messages.append(tool_message(call["id"], content))
        return messages

    def _start(self, build: Build) -> str:
        while True:
            # Not streamed: OpenUI Cloud replies at once and keeps generating.
            content = build.read(self._http.send("POST", DASHBOARD_ROUTE, body=build.request()))
            if content is not None:
                return content
            build.answer(self._run_round(build))

    def _streamed(self, build: Build) -> Iterator[str]:
        while True:
            build.start_stream()
            for chunk in self._http.stream(DASHBOARD_ROUTE, build.request()):
                text = build.feed(chunk)
                if text:
                    yield text
            if build.end_stream():
                return
            build.answer(self._run_round(build))


class AsyncDashboard:
    """`Dashboard`, for `AsyncOpenUIClient`. With `stream=True`, await the call for an async
    iterator."""

    def __init__(
        self,
        http: AsyncHttp,
        options: Options,
        load_tools: Callable[[], Awaitable[dict[str, DataTool]]],
    ) -> None:
        self._http, self._options, self._load_tools = http, options, load_tools
        self.interpreter = AsyncInterpreter(http, load_tools)
        """Runs this dashboard's data tools and generated scripts on your server."""

    @overload
    async def create(
        self,
        *,
        title: str,
        prompt: str,
        context: ExecutionContext,
        stream: Literal[False] = False,
    ) -> str: ...
    @overload
    async def create(
        self, *, title: str, prompt: str, context: ExecutionContext, stream: Literal[True]
    ) -> AsyncIterator[str]: ...
    async def create(
        self, *, title: str, prompt: str, context: ExecutionContext, stream: bool = False
    ) -> str | AsyncIterator[str]:
        build = await self._build(context, prompt, title=title)
        return self._streamed(build) if stream else await self._start(build)

    @overload
    async def edit(
        self,
        *,
        id: str,
        prompt: str,
        context: ExecutionContext,
        stream: Literal[False] = False,
    ) -> str: ...
    @overload
    async def edit(
        self, *, id: str, prompt: str, context: ExecutionContext, stream: Literal[True]
    ) -> AsyncIterator[str]: ...
    async def edit(
        self, *, id: str, prompt: str, context: ExecutionContext, stream: bool = False
    ) -> str | AsyncIterator[str]:
        if not isinstance(id, str) or not id:
            raise invalid_input("id is required")
        build = await self._build(context, prompt, id=id)
        return self._streamed(build) if stream else await self._start(build)

    async def get(self, *, id: str, context: ExecutionContext) -> Artifact:
        assert_context(context)
        calls = ArtifactCalls(self._options.app_id)
        return await self._http.call(calls.get(id, context["user_id"], context.get("group_ids")))

    async def _tools(self) -> dict[str, DataTool]:
        try:
            return await self._load_tools()
        except ToolExecutionError as error:
            raise OpenUIApiError(error.message, error.code, error.status) from error

    async def tools(self, context: ToolUser) -> dict[str, AsyncDashboardTool]:
        """`Dashboard.tools`, with `async` `execute`s; the user function may be async too."""
        return async_dashboard_tools(self, tool_definitions(await self._tools()), context)

    def mcp_server(self, context: ToolUser) -> Server[Any]:
        """The same tools as an MCP server: Python's MCP SDK `Server`, so
        `mcp.client.Client(server)` connects to it in this process, and
        `server.streamable_http_app()` serves it over HTTP. `context` is a user, or
        `resolve(request)` finding each call's user from the HTTP request (None in process);
        returning None refuses the call. It returns at once, so you can mount it at import time;
        the data tools load when a client first lists the tools. Needs `openui-server[mcp]`."""

        async def data() -> list[JsonObject]:
            return tool_definitions(await self._tools())

        return dashboard_mcp_server(self, data, context)

    async def _build(self, context: ExecutionContext, prompt: str, **call: str) -> Build:
        assert_context(context)
        definitions = tool_definitions(await self._tools())
        return Build(self._options, context, prompt, definitions, **call)

    async def _run_round(self, build: Build) -> list[JsonObject]:
        tools = await self._tools()

        async def run(call: JsonObject) -> JsonObject:
            try:
                request = build.round_request(call, tools)
                content = json_text(await self.interpreter.execute(request, build.context))
            except Exception as error:
                content = tool_error_content(error)
            return tool_message(call["id"], content)

        return list(await asyncio.gather(*(run(call) for call in build.calls)))

    async def _start(self, build: Build) -> str:
        while True:
            reply = await self._http.send("POST", DASHBOARD_ROUTE, body=build.request())
            content = build.read(reply)
            if content is not None:
                return content
            build.answer(await self._run_round(build))

    async def _streamed(self, build: Build) -> AsyncIterator[str]:
        while True:
            build.start_stream()
            async for chunk in self._http.stream(DASHBOARD_ROUTE, build.request()):
                text = build.feed(chunk)
                if text:
                    yield text
            if build.end_stream():
                return
            build.answer(await self._run_round(build))
