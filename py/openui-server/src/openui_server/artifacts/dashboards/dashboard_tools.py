"""The dashboard tools for agents (`artifacts/dashboards/dashboard-tools.ts`): their copy, schemas
and calls, shared by `tools()` and the MCP server. Guidance lives in the descriptions: most agent
SDKs drop an MCP server's `instructions`."""

from __future__ import annotations

import inspect
import re
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from ...core.errors import OpenUIApiError, invalid_input
from ...core.http import JsonObject, json_text
from ...interpreter.types import ExecutionContext, ToolExecutionError

if TYPE_CHECKING:
    from ..types import Artifact
    from . import AsyncDashboard, Dashboard

CREATE, EDIT, GET = "create_dashboard", "edit_dashboard", "get_dashboard"

ToolUser = ExecutionContext | Callable[[Any], ExecutionContext | Awaitable[ExecutionContext]]
"""Who the tools act for: a context dict, or a function that finds it from the framework's call
context on each call."""

SERVER_INSTRUCTIONS = """Build and change live dashboards for the signed-in user. A dashboard loads its own data every time it opens, so you never see its numbers and must not state any.
- Call create_dashboard only when the user asks for a new dashboard. "It" or "this" means the dashboard you made or changed last: change it with edit_dashboard and its id.
- Write each prompt as a complete brief. The builder sees only the prompt, not this conversation.
- Build what the user asked for. Don't add sections they didn't ask for; if the request is vague, pick a sensible set and say so.
- To answer a question about a dashboard, or before changing one from an earlier conversation, read it with get_dashboard.
- The user watches the dashboard build, so after a create or edit reply in ONE short sentence: name the dashboard and offer one change. Example: "Your sales by region dashboard is on its way. Want a filter by quarter too?" Don't list its sections, charts or numbers, and don't repeat the tool result."""  # noqa: E501
"""For MCP clients that read `instructions`."""

# Models follow a reminder in the result more reliably than one in the description.
RESULT_REMINDER = {
    CREATE: "Reply to the user in ONE short sentence: name the dashboard and offer one change. "
    "Don't list its sections, charts or numbers; they're on screen.",
    EDIT: "Reply to the user in ONE short sentence saying what changed. "
    "Don't list the rest of the dashboard.",
}


def _data_line(definition: Mapping[str, Any]) -> str:
    """A data tool's first sentence, for "Dashboards can show"."""
    description = definition.get("description") or ""
    sentence = re.split(r"(?<=\.)\s+(?=[A-Z])", description)[0]
    sentence = re.sub(r"\.\Z", "", re.sub(r"\s*\([^()]*\)", "", sentence))
    if len(sentence) <= 160:
        return f"- {definition['name']}: {sentence}"
    cut = sentence[:160]
    shortened = re.sub(r"[,;:]\Z", "", cut[: cut.rfind(" ")])
    return f"- {definition['name']}: {shortened}…"


def _string(description: str) -> JsonObject:
    return {"type": "string", "description": description}


_ID = _string(
    "The dashboard's id (art_…), from the create_dashboard, edit_dashboard or get_dashboard "
    "result for it."
)

# Each tool's input: every property a required string.
INPUTS: dict[str, dict[str, JsonObject]] = {
    CREATE: {
        "title": _string('A short title the user will recognise, such as "Orders, last 30 days".'),
        "prompt": _string(
            "The complete brief. The builder sees only this, not the chat: the question the "
            "dashboard answers, its sections, metrics, charts, tables and filters, the time range, "
            "and which data each part uses. Include every name, id and preference from the "
            "conversation. Ask only for what the user wants; don't add sections they didn't ask "
            "for. No numbers."
        ),
    },
    EDIT: {
        "id": _ID,
        "prompt": _string(
            "The change, written to stand alone: what to add, remove or change, and which data it "
            "uses. No numbers."
        ),
    },
    GET: {"id": _ID},
}


def _missing(input: Mapping[str, Any], keys: Sequence[str]) -> list[str]:
    """The required keys `input` lacks."""
    return [key for key in keys if not isinstance(input.get(key), str) or not input[key].strip()]


def tool_specs(data: Sequence[Mapping[str, Any]]) -> dict[str, JsonObject]:
    """Each tool's copy, with the data dashboards can show."""
    data_list = (
        "\n\nDashboards can show this data, and nothing else:\n"
        + "\n".join(_data_line(definition) for definition in data)
        if data
        else ""
    )
    return {
        CREATE: {
            "title": "Create dashboard",
            "description": "Create a new live dashboard for the user. Use it only when the user "
            "asks for a new dashboard; to change an existing one, call edit_dashboard. The "
            "dashboard loads its data live every time it opens, so describe what to show and never "
            "include numbers. Returns once the dashboard starts building (usually 20-45 s). The "
            "user watches it build, so then reply in ONE short sentence that names the dashboard "
            "and offers one change. Don't list its sections or repeat the result." + data_list,
            "properties": INPUTS[CREATE],
            "read_only": False,
        },
        EDIT: {
            "title": "Edit dashboard",
            "description": "Change an existing dashboard in place: add, remove or rework sections, "
            'charts, tables or filters. "It" or "this" means the dashboard you created or changed '
            "last; use its id. Prefer this over create_dashboard unless the user asks for a new "
            "dashboard. Make one change per call. Returns once the change starts; the user sees "
            "the dashboard update, so then reply in ONE short sentence saying what changed.",
            "properties": INPUTS[EDIT],
            "read_only": False,
        },
        GET: {
            "title": "Read dashboard",
            "description": "Read a dashboard the user can open: its name, its layout as an OpenUI "
            "program (sections, charts, tables, and the data each uses) and whether the user can "
            "edit it. It has no numbers; the dashboard loads them when it opens. Use it to answer "
            "questions about a dashboard, or before changing one from an earlier conversation. "
            "Answer from it in plain words; don't paste the program. If isEditable is false, don't "
            "call edit_dashboard: offer to create a new dashboard instead.",
            "properties": INPUTS[GET],
            "read_only": True,
        },
    }


def json_schema(properties: Mapping[str, JsonObject]) -> JsonObject:
    """Every property is a required string."""
    return {
        "type": "object",
        "properties": dict(properties),
        "required": list(properties),
        "additionalProperties": False,
    }


def explain(error: BaseException, tool: str, input: Mapping[str, Any]) -> str:
    """A sentence the model can act on."""
    known = error if isinstance(error, OpenUIApiError | ToolExecutionError) else None
    if known is not None and known.code == "invalid_input":
        return str(error)
    failed = (
        "The dashboard couldn't be read"
        if tool == GET
        else "The change couldn't be started"
        if tool == EDIT
        else "The dashboard couldn't be started"
    )
    status = known.status if known is not None else None
    if status == 404:
        return (
            f"No dashboard with id {input.get('id')} that this user can open. Use the id from a "
            "create_dashboard or edit_dashboard result."
        )
    if status == 403:
        return "This user can't change that dashboard. Offer to create a new one instead."
    if status == 409:
        return (
            "That dashboard is being changed right now. Wait for the change to finish, then try "
            "again."
        )
    if status == 429:
        return "Too many dashboard requests right now. Tell the user to try again in a minute."
    return f"{failed}: {error}"


def check_call(name: str, input: Mapping[str, Any]) -> None:
    if name not in INPUTS:
        raise invalid_input(
            f'Unknown tool "{name}". Use create_dashboard, edit_dashboard or get_dashboard.'
        )
    keys = _missing(input, list(INPUTS[name]))
    if keys:
        raise invalid_input(f"{', '.join(keys)} is required.")


def get_text(artifact: Artifact) -> str:
    """What `get_dashboard` returns: the parts the model needs, as JSON."""
    found: JsonObject = {"content": artifact.content, "isEditable": artifact.is_editable}
    return json_text({"name": artifact.name, **found} if artifact.name is not None else found)


def tool_error(error: Exception, tool: str, input: Mapping[str, Any]) -> ToolExecutionError:
    """The error a tool raises: the sentence, with the cause's code and status."""
    if isinstance(error, OpenUIApiError | ToolExecutionError):
        return ToolExecutionError(explain(error, tool, input), error.code, error.status)
    return ToolExecutionError(explain(error, tool, input), "tool_exec_error")


def mcp_tool_list(data: Sequence[Mapping[str, Any]]) -> list[JsonObject]:
    """The tools as MCP lists them."""
    return [
        {
            "name": name,
            "title": spec["title"],
            "description": spec["description"],
            "inputSchema": json_schema(spec["properties"]),
            "annotations": {
                "readOnlyHint": spec["read_only"],
                "destructiveHint": False,
                "idempotentHint": spec["read_only"],
                "openWorldHint": False,
            },
        }
        for name, spec in tool_specs(data).items()
    ]


# ─── tools() ─────────────────────────────────────────────────────────────────────────────


@dataclass(frozen=True, kw_only=True)
class DashboardTool:
    """A dashboard tool for agent frameworks. `execute(input, call_context=None)` returns OpenUI
    Cloud's response for create and edit (pass it to the renderer as is), or the dashboard as JSON
    for get, and raises `ToolExecutionError` with a sentence for the model."""

    name: str
    description: str
    input_schema: JsonObject
    """JSON Schema: every property a required string."""
    execute: Callable[..., str]


@dataclass(frozen=True, kw_only=True)
class AsyncDashboardTool:
    """`DashboardTool`, for `AsyncOpenUIClient`: `execute` is a coroutine."""

    name: str
    description: str
    input_schema: JsonObject
    execute: Callable[..., Awaitable[str]]


def _with_reminder(name: str, text: str) -> str:
    """The reminder follows the reference line, which renderers ignore."""
    reminder = RESULT_REMINDER.get(name)
    return f"{text}\n\n{reminder}" if reminder else text


def run_tool(
    dashboard: Dashboard, name: str, input: Mapping[str, Any], context: ExecutionContext
) -> str:
    """Runs one tool as `context`'s user: its response, without the reminder."""
    check_call(name, input)
    if name == GET:
        return get_text(dashboard.get(id=input["id"], context=context))
    if name == CREATE:
        return dashboard.create(title=input["title"], prompt=input["prompt"], context=context)
    return dashboard.edit(id=input["id"], prompt=input["prompt"], context=context)


async def run_tool_async(
    dashboard: AsyncDashboard, name: str, input: Mapping[str, Any], context: ExecutionContext
) -> str:
    check_call(name, input)
    if name == GET:
        return get_text(await dashboard.get(id=input["id"], context=context))
    if name == CREATE:
        return await dashboard.create(title=input["title"], prompt=input["prompt"], context=context)
    return await dashboard.edit(id=input["id"], prompt=input["prompt"], context=context)


def dashboard_tools(
    dashboard: Dashboard, data: Sequence[Mapping[str, Any]], user: ToolUser
) -> dict[str, DashboardTool]:
    specs = tool_specs(data)

    def tool(name: str) -> DashboardTool:
        def execute(input: Mapping[str, Any], call_context: Any = None) -> str:
            try:
                context = user(call_context) if callable(user) else user
                if inspect.isawaitable(context):
                    if inspect.iscoroutine(context):
                        context.close()
                    raise invalid_input("An async user function needs AsyncOpenUIClient")
                return _with_reminder(name, run_tool(dashboard, name, input, context))
            except Exception as error:
                raise tool_error(error, name, input) from error

        return DashboardTool(
            name=name,
            description=specs[name]["description"],
            input_schema=json_schema(specs[name]["properties"]),
            execute=execute,
        )

    return {name: tool(name) for name in (CREATE, EDIT, GET)}


async def resolve_user(user: ToolUser, call_context: Any) -> ExecutionContext:
    context = user(call_context) if callable(user) else user
    return await context if inspect.isawaitable(context) else context


def async_dashboard_tools(
    dashboard: AsyncDashboard, data: Sequence[Mapping[str, Any]], user: ToolUser
) -> dict[str, AsyncDashboardTool]:
    specs = tool_specs(data)

    def tool(name: str) -> AsyncDashboardTool:
        async def execute(input: Mapping[str, Any], call_context: Any = None) -> str:
            try:
                context = await resolve_user(user, call_context)
                return _with_reminder(name, await run_tool_async(dashboard, name, input, context))
            except Exception as error:
                raise tool_error(error, name, input) from error

        return AsyncDashboardTool(
            name=name,
            description=specs[name]["description"],
            input_schema=json_schema(specs[name]["properties"]),
            execute=execute,
        )

    return {name: tool(name) for name in (CREATE, EDIT, GET)}
