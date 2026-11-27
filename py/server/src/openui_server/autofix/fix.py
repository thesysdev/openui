"""Autofix requests (`autofix/fix.ts`): the body `/v1/autofix` takes, with your library's config
block."""

from __future__ import annotations

from collections.abc import (
    Mapping,
    Sequence,
)
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass
from ..core.cloud_config import cloud_config, config_block
from ..core.http import JsonObject
from .diagnostics import repair_context
from .types import MAX_AUTOFIX_GENERATION_LENGTH, AutofixError

AUTOFIX_ROUTE = "/v1/autofix"


def autofix_system_block(library: Any) -> str:
    """The config block `/v1/autofix` reads the library from. Raises for an invalid library."""
    if not isinstance(library, Mapping) or not isinstance(library.get("schema"), Mapping):
        raise AutofixError("A library spec with schema is required", "invalid_library")
    try:
        return config_block(cloud_config(library))
    except ValueError as error:
        raise AutofixError(str(error), "invalid_library") from None


def fix_body(system_block: str, generation: str, messages: Sequence[Any] | None) -> JsonObject:
    if len(generation) > MAX_AUTOFIX_GENERATION_LENGTH:
        raise AutofixError("Generation exceeds 100,000 characters", "generation_too_large")
    return {
        "messages": [
            {"role": "system", "content": system_block},
            *repair_context(messages or []),
            {"role": "assistant", "content": generation},
        ]
    }
