"""A build's tool rounds (`artifacts/dashboards/tool-round.ts`)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from ...core.http import JsonObject, json_text
from ...interpreter.types import DataTool, ToolExecutionError, code_of, object_args

# The model saves one of the dashboard's scripts and runs it once: `{ name, code, args? }`.
# OpenUI Cloud keeps the code; this runs it by name, as a dashboard runs its scripts.
CREATE_SCRIPT_TOOL = "openui_create_script"


def round_request(
    call: Mapping[str, Any],
    tools: Mapping[str, DataTool],
    artifact_id: str,
    version: str | None,
) -> JsonObject:
    """What the interpreter runs for one of the model's tool calls during a build."""
    function = call.get("function") or {}
    name = function.get("name")
    if name != CREATE_SCRIPT_TOOL and name not in tools:
        raise ToolExecutionError(f"Unknown tool: {name}", "tool_not_found")
    args = object_args(function.get("arguments"))
    if name != CREATE_SCRIPT_TOOL:
        return {"name": name, "arguments": args}
    request: JsonObject = {"name": args.get("name"), "id": artifact_id}
    if args.get("args") is not None:
        request["arguments"] = args["args"]
    if version is not None:
        request["version"] = version
    return request


def tool_message(call_id: str, content: str) -> JsonObject:
    return {"role": "tool", "tool_call_id": call_id, "content": content}


def tool_error_content(error: Exception) -> str:
    """A failing tool is an answer for the model, not a failed build."""
    return json_text({"error": {"code": code_of(error), "message": str(error)}})
