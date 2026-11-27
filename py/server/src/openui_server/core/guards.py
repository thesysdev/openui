"""Shape checks (`core/guards.ts`)."""

from __future__ import annotations


def is_id_list(value: object) -> bool:
    """A list of non-empty strings, such as `group_ids`."""
    return isinstance(value, list | tuple) and all(
        isinstance(item, str) and item.strip() for item in value
    )
