"""Acting as a user (`core/act-as.ts`)."""

from __future__ import annotations

from collections.abc import Sequence

from ..interpreter.types import ExecutionContext
from .errors import invalid_input
from .guards import is_id_list
from .http import JsonObject


def act_as(
    app_id: str | None, user_id: str | None, group_ids: Sequence[str] | None
) -> dict[str, str | list[str]]:
    """Acting as a user names them and their groups, in the client's app if it has one, as their
    frontend token would. Without a user it's your org, which has no app or groups."""
    if user_id is None:
        if group_ids is not None:
            raise invalid_input("group_ids needs user_id: they're that user's groups")
        return {}
    if not isinstance(user_id, str) or not user_id.strip():
        raise invalid_input(
            "user_id must be a non-empty string: take it from your authenticated session"
        )
    if group_ids is not None and not is_id_list(group_ids):
        raise invalid_input("group_ids must be a list of non-empty strings")
    query: dict[str, str | list[str]] = {"user_id": user_id}
    if group_ids:
        query["group_ids"] = list(group_ids)
    if app_id is not None:
        query["app_id"] = app_id
    return query


def acting_user(context: ExecutionContext) -> JsonObject:
    """`user_id` and, when there are any, `group_ids`, as a request body names them."""
    body: JsonObject = {"user_id": context["user_id"]}
    if context.get("group_ids"):
        body["group_ids"] = list(context["group_ids"])
    return body
