"""Data tools and who they run for (`interpreter/types.ts`)."""

from __future__ import annotations

import json
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    NotRequired,
    TypedDict,
)

if TYPE_CHECKING:
    pass
from ..core.guards import is_id_list

ExecutionContext = Mapping[str, Any]
"""Who a dashboard call is for, as a dict: `{"user_id": ..., "group_ids": [...]}` from your
session, plus anything else your tools need; they get the whole dict as is.

- `user_id` (required): the signed-in user.
- `group_ids`: the groups the user is in, from your own system: dashboards shared with any of
  them are theirs to open. Up to 10, each up to 64 characters."""


@dataclass(frozen=True, kw_only=True)
class DataTool:
    """A data tool: what generation sees, plus the function that runs it on your server.

    `execute(args, context)` gets the model's or the script's arguments and your context as is,
    and returns JSON-serializable data. On the async client it may be an `async def`."""

    execute: Callable[[dict[str, Any], ExecutionContext], Any]
    parameters: dict[str, Any]
    """A JSON Schema object for the arguments."""
    description: str | None = None
    output: Any = None
    """An illustrative output, so generation knows the data's shape."""


class InterpreterRequest(TypedDict):
    """What the renderer sends your interpreter for each data tool call."""

    name: str
    arguments: NotRequired[dict[str, Any]]
    id: NotRequired[str]
    """The artifact the call is for. Generated scripts run from its stored content."""
    version: NotRequired[str]
    """The version the renderer shows. A script run against an older one is refused (409)."""


class ToolExecutionError(Exception):
    """A failed data tool or script run, with a stable `code` and an optional HTTP `status`."""

    def __init__(self, message: str, code: str, status: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status


def assert_context(context: Any) -> None:
    """Every call needs `context["user_id"]`, and `group_ids`, when set, must be ids."""
    user_id = context.get("user_id") if isinstance(context, Mapping) else None
    if not isinstance(user_id, str) or not user_id.strip():
        raise ToolExecutionError(
            'context["user_id"] is required: the signed-in user, from your session',
            "invalid_input",
            400,
        )
    group_ids = context.get("group_ids")
    if group_ids is not None and not is_id_list(group_ids):
        raise ToolExecutionError(
            'context["group_ids"] must be a list of non-empty strings', "invalid_input", 400
        )


def code_of(error: BaseException) -> str:
    return error.code if isinstance(error, ToolExecutionError) else "tool_exec_error"


def timed_out() -> ToolExecutionError:
    return ToolExecutionError("Tool execution timed out", "tool_timeout", 504)


def unknown_tool(name: str) -> ToolExecutionError:
    return ToolExecutionError(f"Unknown customer tool: {name}", "tool_not_found", 404)


def async_tool(name: str) -> ToolExecutionError:
    return ToolExecutionError(
        f"{name} is an async tool: use AsyncOpenUIClient to run it", "invalid_tools"
    )


def object_args(arguments: Any, code: str = "bad_args") -> dict[str, Any]:
    """A tool call's JSON arguments, which must be an object."""
    args = json.loads(arguments) if isinstance(arguments, str) else arguments
    if not isinstance(args, dict):
        raise ToolExecutionError("Tool arguments must be a JSON object", code)
    return args
