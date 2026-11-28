"""The client itself: keys, errors, frontend tokens."""

from __future__ import annotations

import httpx
import pytest
from support import FakeCloud, settle

from openui_server import OpenUIApiError, OpenUIClient


async def test_reads_the_api_key_on_each_call(
    cloud: FakeCloud, kind: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    cloud.on("GET", "/v1/conversations/c1", {"id": "c1", "created_at": 1})
    openui = cloud.client(kind, api_key=None)  # Creating the client never needs a key.
    with pytest.raises(OpenUIApiError) as error:
        await settle(openui.conversations.get("c1"))
    assert error.value.code == "missing_api_key"
    assert cloud.sent == []

    monkeypatch.setenv("THESYS_API_KEY", "from-env")
    await settle(openui.conversations.get("c1"))
    assert cloud.last.headers["authorization"] == "Bearer from-env"


@pytest.mark.parametrize(
    ("status", "body", "code", "message"),
    [
        (
            404,
            {"json": {"error": {"code": "not_found", "message": "No such"}}},
            "not_found",
            "No such",
        ),
        (400, {"json": {"message": "Bad thing"}}, "http_error", "Bad thing"),
        (500, {"text": "<html>oops</html>"}, "http_error", "OpenUI Cloud request failed: HTTP 500"),
    ],
)
async def test_maps_failed_responses(
    cloud: FakeCloud, kind: str, status: int, body: dict[str, object], code: str, message: str
) -> None:
    cloud.on("GET", "/v1/conversations/c1", lambda _: httpx.Response(status, **body))  # type: ignore[arg-type]
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).conversations.get("c1"))
    assert (error.value.code, error.value.message, error.value.status) == (code, message, status)


async def test_rejects_a_body_that_is_not_an_object(cloud: FakeCloud, kind: str) -> None:
    cloud.on("GET", "/v1/conversations/c1", httpx.Response(200, json=[1, 2]))
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).conversations.get("c1"))
    assert (error.value.code, error.value.status) == ("invalid_response", 502)


async def test_encodes_ids_in_paths(cloud: FakeCloud, kind: str) -> None:
    cloud.on("GET", "/v1/conversations*", {"id": "a/b", "created_at": 1})
    await settle(cloud.client(kind).conversations.get("a/b"))
    assert cloud.last.raw_path == b"/v1/conversations/a%2Fb"


def test_rejects_an_empty_app_id() -> None:
    with pytest.raises(OpenUIApiError) as error:
        OpenUIClient(app_id=" ")
    assert error.value.code == "invalid_input"


async def test_frontend_token_names_the_user_groups_and_app(cloud: FakeCloud, kind: str) -> None:
    cloud.on("POST", "/v1/frontend-tokens", {"token": "fct_1", "expires_at": 1700000000})
    openui = cloud.client(kind, app_id="app1")
    token = await settle(openui.create_frontend_token(user_id="u1", group_ids=["g1", "g2"]))
    assert token == {"token": "fct_1", "expires_at": 1700000000}
    assert cloud.last.body == {"user_id": "u1", "group_ids": ["g1", "g2"], "app_id": "app1"}


@pytest.mark.parametrize("user_id", ["", "  "])
async def test_frontend_token_needs_a_user(cloud: FakeCloud, kind: str, user_id: str) -> None:
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).create_frontend_token(user_id=user_id))
    assert error.value.code == "invalid_input"
    assert cloud.sent == []
