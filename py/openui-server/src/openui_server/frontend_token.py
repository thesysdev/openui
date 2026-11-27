"""Frontend tokens (`frontend-token.ts`)."""

from __future__ import annotations

from typing import (
    TYPE_CHECKING,
    Any,
    TypedDict,
)

if TYPE_CHECKING:
    pass
from .core.errors import invalid_input, invalid_response
from .core.guards import is_id_list
from .core.http import Call, JsonObject


class FrontendToken(TypedDict):
    """A user's frontend token, in the shape the browser's `createFrontendTokenManager` reads:
    return it from your token route as is."""

    token: str
    """`fct_…`, for the `x-thesys-frontend-token` header."""
    expires_at: int
    """When it expires, in unix seconds."""


def frontend_token_call(app_id: str | None, user_id: Any, group_ids: Any) -> Call[FrontendToken]:
    """Mints a frontend token for `user_id` and their `group_ids`, in the client's app if it
    has one, with your API key."""
    if not isinstance(user_id, str) or not user_id.strip():
        raise invalid_input("user_id is required: take it from your authenticated session")
    if group_ids is not None and not is_id_list(group_ids):
        raise invalid_input("group_ids must be a list of non-empty strings")
    body: JsonObject = {"user_id": user_id}
    if group_ids:
        body["group_ids"] = list(group_ids)
    if app_id is not None:
        body["app_id"] = app_id

    def parse(result: JsonObject) -> FrontendToken:
        token, expires_at = result.get("token"), result.get("expires_at")
        if not isinstance(token, str) or not token or not isinstance(expires_at, int | float):
            raise invalid_response()
        return {"token": token, "expires_at": int(expires_at)}

    return Call("POST", "/v1/frontend-tokens", parse, body=body)
