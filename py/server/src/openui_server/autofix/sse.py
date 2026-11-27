"""Chunks as SSE (`autofix/sse.ts`)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass
from ..core.http import json_text


def chunk_json(chunk: Any) -> str:
    if hasattr(chunk, "model_dump_json"):
        return str(chunk.model_dump_json(by_alias=True, exclude_unset=True))
    return json_text(chunk)
