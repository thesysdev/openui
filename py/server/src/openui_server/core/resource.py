"""Lists, ids and query values every resource shares (`core/resource.ts`)."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import (
    TYPE_CHECKING,
    Any,
    Generic,
    Literal,
    TypeVar,
)
from urllib.parse import quote

if TYPE_CHECKING:
    pass
from .errors import invalid_input, invalid_response
from .http import JsonObject

T = TypeVar("T")


Order = Literal["asc", "desc"]


@dataclass(frozen=True, slots=True)
class Page(Generic[T]):
    """One page of a list."""

    data: list[T]
    has_more: bool
    first_id: str | None = None
    last_id: str | None = None
    """Pass as `after` for the next page."""


def id_path(collection: str, id: object, suffix: str = "") -> str:
    """`/v1/<collection>/<id><suffix>`, after checking the id."""
    if not isinstance(id, str) or not id:
        raise invalid_input("id is required")
    return f"/v1/{collection}/{quote(id, safe='')}{suffix}"


def to_page(page: JsonObject, to_row: Callable[[Any], T]) -> Page[T]:
    """One page of a list, as OpenUI Cloud sends it, with each row mapped by `to_row`."""
    rows = page.get("data")
    if not isinstance(rows, list):
        raise invalid_response()
    first_id, last_id = page.get("first_id"), page.get("last_id")
    return Page(
        data=[to_row(row) for row in rows],
        has_more=page.get("has_more") is True,
        first_id=first_id if isinstance(first_id, str) else None,
        last_id=last_id if isinstance(last_id, str) else None,
    )


def compact(**fields: Any) -> JsonObject:
    """A JSON body without the fields left as None, as JSON.stringify drops undefined ones."""
    return {name: value for name, value in fields.items() if value is not None}


def query_number(value: int | None) -> str | None:
    return None if value is None else str(value)


def query_bool(value: bool | None) -> str | None:
    return None if value is None else ("true" if value else "false")


def timestamp(seconds: object) -> datetime:
    """OpenUI Cloud's unix seconds, as an aware UTC datetime."""
    if not isinstance(seconds, int | float) or isinstance(seconds, bool):
        raise invalid_response()
    return datetime.fromtimestamp(seconds, tz=UTC)
