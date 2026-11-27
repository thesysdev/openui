"""Chat Completions chunks for Autofix (`openai/adapter.ts`)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass
from ..autofix.diagnostics import is_ui_output, split_closed_fence, unwrap_openui_fence
from ..autofix.types import MAX_AUTOFIX_GENERATION_LENGTH, AutofixResult
from ..core.http import JsonObject, json_text


def _as_dict(chunk: Any) -> JsonObject:
    if hasattr(chunk, "model_dump"):
        return dict(chunk.model_dump(mode="json", by_alias=True, exclude_unset=True))
    return dict(chunk)


def _like(template: Any, data: JsonObject) -> Any:
    """`data` as the same kind of chunk as `template`: an openai-python model or a dict."""
    model = type(template)
    return model.model_validate(data) if hasattr(model, "model_validate") else data


def _correction(template: JsonObject, index: int, content: str | None) -> JsonObject:
    """A correction or stop chunk with the original completion's routing fields."""
    chunk: JsonObject = {key: template.get(key) for key in ("id", "object", "created", "model")}
    if "service_tier" in template:
        chunk["service_tier"] = template["service_tier"]
    chunk["choices"] = [
        {
            "index": index,
            "delta": {} if content is None else {"content": content},
            "finish_reason": "stop" if content is None else None,
        }
    ]
    return chunk


@dataclass(frozen=True, slots=True)
class Held:
    id: str
    index: int
    repair: bool


class ChunkRepairs:
    """Text per choice, held closing fences and held endings: the adapter's state. It passes
    chunks through, and before a successful final UI choice closes, it inserts the repair. The
    drivers only call Autofix between `feed` and `release`."""

    def __init__(self) -> None:
        self._texts: dict[str, str | None] = {}
        self._closings: dict[str, str] = {}
        self._has_tools: set[str] = set()
        self._failed: set[str] = set()
        self._done: set[str] = set()

    def feed(self, chunk: Any) -> tuple[Any, list[Held]]:
        """The chunk to pass on, and the choices whose endings wait for `release`."""
        data = _as_dict(chunk)
        held: list[Held] = []
        changed = False
        choices = []
        for choice in data.get("choices") or []:
            id = json_text([data.get("id"), choice.get("index")])
            if id in self._done:
                choices.append(choice)
                continue
            self._texts.setdefault(id, "")
            delta = choice.get("delta") or {}
            # Tools mean this choice isn't the final UI answer.
            if delta.get("tool_calls") or delta.get("function_call"):
                self._has_tools.add(id)
            if delta.get("refusal") is not None:
                self._failed.add(id)

            previous = self._texts[id]
            incoming = delta.get("content") or ""
            if previous is not None:
                combined = previous + incoming
                if len(combined) > MAX_AUTOFIX_GENERATION_LENGTH:
                    # Too large to send to Autofix; stop holding.
                    self._texts[id] = None
                    closing = self._closings.pop(id, None)
                    if closing:
                        choice = {**choice, "delta": {**delta, "content": closing + incoming}}
                        changed = True
                else:
                    self._texts[id] = combined
                    split = split_closed_fence(combined)
                    if split:
                        # Hold the closing fence so a later repair stays inside it.
                        self._closings[id] = split[1]
                        emit = split[0][len(previous) :]
                        choice = {**choice, "delta": {**delta, "content": emit}}
                        changed = True
                    else:
                        self._closings.pop(id, None)

            if not choice.get("finish_reason"):
                choices.append(choice)
                continue
            text = self._texts.get(id)
            repair = (
                choice["finish_reason"] == "stop"
                and id not in self._has_tools
                and id not in self._failed
                and text is not None
                and is_ui_output(text)
            )
            if repair or id in self._closings:
                held.append(Held(id, choice.get("index", 0), repair))
                choice = {**choice, "finish_reason": None}
                changed = True
            else:
                self._done.add(id)
            choices.append(choice)
        return (_like(chunk, {**data, "choices": choices}) if changed else chunk), held

    def repair_text(self, held: Held) -> str | None:
        """The generation to send to Autofix for a held choice, if it needs a check."""
        text = self._texts.get(held.id)
        return text if held.repair and text is not None and is_ui_output(text) else None

    def release(self, template: Any, held: Held, result: AutofixResult | None) -> list[Any]:
        """A held choice's ending: the repair, when Autofix changed the text, then the held
        closer, then the stop."""
        data = _as_dict(template)
        out = []
        if result is not None and result.status == "fixed" and result.content is not None:
            content = f"\n{unwrap_openui_fence(result.content)}\n"
            out.append(_correction(data, held.index, content))
        closing = self._closings.pop(held.id, None)
        if closing:
            out.append(_correction(data, held.index, closing))
        self._done.add(held.id)
        self._texts.pop(held.id, None)
        out.append(_correction(data, held.index, None))
        return [_like(template, chunk) for chunk in out]
