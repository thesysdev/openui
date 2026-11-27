"""Reading Autofix answers and finding OpenUI Lang in text (`autofix/diagnostics.ts`)."""

from __future__ import annotations

import re
from collections.abc import (
    Sequence,
)
from typing import TYPE_CHECKING, Any

import httpx

if TYPE_CHECKING:
    pass
from ..core.http import JsonObject
from .types import AutofixDiagnostic, AutofixError, AutofixResult


def _diagnostics(value: Any) -> list[AutofixDiagnostic]:
    if not isinstance(value, list):
        raise AutofixError("Malformed Autofix diagnostics", "invalid_response")
    diagnostics = []
    for entry in value:
        if (
            not isinstance(entry, dict)
            or not isinstance(entry.get("code"), str)
            or not isinstance(entry.get("message"), str)
        ):
            raise AutofixError("Malformed Autofix diagnostic", "invalid_response")
        text = {key: entry.get(key) for key in ("component", "path", "statementId")}
        diagnostics.append(
            AutofixDiagnostic(
                code=entry["code"],
                message=entry["message"],
                component=text["component"] if isinstance(text["component"], str) else None,
                path=text["path"] if isinstance(text["path"], str) else None,
                statement_id=text["statementId"] if isinstance(text["statementId"], str) else None,
            )
        )
    return diagnostics


def read_fix(response: httpx.Response, original: str) -> AutofixResult:
    """The Autofix API's answer, without reparsing the program. The body must be read."""
    if not response.is_success:
        raise AutofixError(
            f"Autofix request failed: HTTP {response.status_code}",
            "http_error",
            response.status_code,
        )
    try:
        body = response.json()
    except ValueError as error:
        raise AutofixError(
            f"Could not read Autofix response: {error}", "invalid_response"
        ) from None
    summary = body.get("fix_summary") if isinstance(body, dict) else None
    if not isinstance(summary, dict):
        raise AutofixError("Missing Autofix summary", "invalid_response")
    status = summary.get("status")
    if status not in ("fixed", "already_valid", "fix_failed"):
        raise AutofixError("Unknown Autofix status", "invalid_response")
    choices = body.get("choices")
    choice = choices[0] if isinstance(choices, list) and choices else None
    message = choice.get("message") if isinstance(choice, dict) else None
    has_content = isinstance(message, dict) and "content" in message
    content = message.get("content") if isinstance(message, dict) else None
    if (status == "fix_failed" and (not has_content or content is not None)) or (
        status != "fix_failed" and not isinstance(content, str)
    ):
        raise AutofixError("Malformed Autofix content", "invalid_response")
    return AutofixResult(
        status=status,
        original=original,
        content=content,
        fixed_errors=_diagnostics(summary.get("fixed_errors")),
        unfixed_errors=_diagnostics(summary.get("unfixed_errors")),
    )


def repair_context(messages: Sequence[Any]) -> list[JsonObject]:
    """Recent text context, within the endpoint's limit of 20 messages and 8,000 characters."""
    context: list[JsonObject] = []
    remaining = 8_000
    for message in reversed(messages):
        if len(context) >= 20 or remaining <= 0:
            break
        role = message.get("role")
        if role not in ("user", "assistant", "system", "developer"):
            continue
        content = message.get("content")
        text = (
            content
            if isinstance(content, str)
            else "\n".join(
                (part.get("text") or "") if part.get("type") == "text" else ""
                for part in content or []
            )
        )
        if not text:
            continue
        piece = text[-remaining:]
        context.insert(0, {"role": role, "content": piece})
        remaining -= len(piece)
    return context


_OPENUI_FENCE = re.compile(r"```openui(?:-lang)?\s*\n")


_ROOT_ASSIGN = re.compile(r"(^|\n)\s*root\s*=")


_CONTENT_OPEN = "]]>openui:content"


_CONTENT_END = "]]>openui:end"


_FENCE_CLOSE = "```"


_FENCE_CLOSE_WITH_END = "```\n]]>openui:end"


def _fence_at(text: str) -> int:
    match = _OPENUI_FENCE.search(text)
    return match.start() if match else -1


def is_ui_output(text: str) -> bool:
    """OpenUI Lang is a Cloud content marker, a fenced ```openui block, or an unfenced `root =`
    program."""
    return _CONTENT_OPEN in text or _fence_at(text) >= 0 or bool(_ROOT_ASSIGN.search(text))


def split_closed_fence(text: str) -> tuple[str, str] | None:
    """A closed OpenUI block and its closer (```, or ``` plus ]]>openui:end)."""
    fence, content = _fence_at(text), text.find(_CONTENT_OPEN)
    opened = fence if fence >= 0 else content
    if opened < 0:
        return None
    newline = text.find("\n", opened)
    if newline < 0:
        return None
    start = newline + 1
    # Prefer the Cloud closer so a later repair stays inside ]]>openui:content … end.
    if content >= 0:
        for closer in (_FENCE_CLOSE_WITH_END, _CONTENT_END):
            close = text.find(closer, start)
            if close >= 0:
                return text[:close], text[close:]
        # The fence is open but ]]>openui:end hasn't arrived; hold a bare ``` if present.
        if fence < 0:
            return None
    close = text.find(_FENCE_CLOSE, start)
    return None if close < 0 else (text[:close], text[close:])


def unwrap_openui_fence(text: str) -> str:
    """The inner OpenUI program, without a wrapping markdown fence or Cloud markers."""
    fence = _fence_at(text)
    if fence >= 0:
        start = text.find("\n", fence) + 1
        close = text.find(_FENCE_CLOSE, start)
        return (text[start:] if close < 0 else text[start:close]).strip()
    content = text.find(_CONTENT_OPEN)
    if content < 0:
        return text
    start = text.find("\n", content) + 1
    close = text.find(_CONTENT_END, start)
    return (text[start:] if close < 0 else text[start:close]).strip()
