"""`openui.artifacts`: act-as rules, query strings and share checks."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from support import FakeCloud, settle

from openui_server import OpenUIApiError

ARTIFACT = {
    "id": "a1",
    "kind": "dashboard",
    "name": "Sales",
    "content": "root = Stack([])",
    "version": "3",
    "pinned": True,
    "is_owner": True,
    "is_editable": True,
    "shares": [
        {"type": "group", "id": "g1", "access": "view", "created_by": "u1", "created_at": 1}
    ],
    "created_at": 1700000000,
    "updated_at": 1700000500,
}


async def test_list_sends_every_filter(cloud: FakeCloud, kind: str) -> None:
    cloud.on("GET", "/v1/artifacts", {"data": [ARTIFACT], "has_more": False})
    openui = cloud.client(kind, app_id="app1")
    page = await settle(
        openui.artifacts.list(
            user_id="u1",
            group_ids=["g1", "g2"],
            kind=["dashboard", "report"],
            name="Sal",
            pinned=True,
            is_owner=False,
            conversation_id="c1",
            limit=10,
            after="a0",
            order="asc",
        )
    )
    assert cloud.last.query == {
        "user_id": ["u1"],
        "group_ids": ["g1", "g2"],
        "app_id": ["app1"],
        "kind": ["dashboard", "report"],
        "name": ["Sal"],
        "pinned": ["true"],
        "is_owner": ["false"],
        "conversation_id": ["c1"],
        "limit": ["10"],
        "after": ["a0"],
        "order": ["asc"],
    }
    artifact = page.data[0]
    assert (artifact.is_owner, artifact.shares[0].created_by) == (True, "u1")
    assert artifact.updated_at == datetime(2023, 11, 14, 22, 21, 40, tzinfo=UTC)


async def test_without_a_user_calls_act_as_the_org(cloud: FakeCloud, kind: str) -> None:
    cloud.on("DELETE", "/v1/artifacts/a1", {"id": "a1", "deleted": True})
    await settle(cloud.client(kind, app_id="app1").artifacts.delete("a1"))
    assert cloud.last.query == {}


async def test_update_renames_without_content(cloud: FakeCloud, kind: str) -> None:
    cloud.on("POST", "/v1/artifacts/a1", ARTIFACT)
    await settle(cloud.client(kind).artifacts.update("a1", name="Sales 2", user_id="u1"))
    assert (cloud.last.body, cloud.last.query) == ({"name": "Sales 2"}, {"user_id": ["u1"]})


async def test_pins_belong_to_a_user(cloud: FakeCloud, kind: str) -> None:
    cloud.on("POST", "/v1/artifacts/a1/pin", ARTIFACT)
    openui = cloud.client(kind)
    with pytest.raises(OpenUIApiError) as error:
        await settle(openui.artifacts.pin("a1", user_id=None))
    assert error.value.code == "invalid_input"
    assert (await settle(openui.artifacts.pin("a1", user_id="u1"))).pinned is True


@pytest.mark.parametrize(
    ("target", "access"),
    [
        ({}, "view"),
        ({"user": "u2", "group": "g1"}, "view"),
        ({"user": ""}, "view"),
        ({"user": "u2"}, "own"),
    ],
)
async def test_share_checks_its_target(
    cloud: FakeCloud, kind: str, target: dict[str, str], access: str
) -> None:
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).artifacts.share("a1", access=access, **target))
    assert error.value.code == "invalid_input"
    assert cloud.sent == []


async def test_share_and_unshare_bodies(cloud: FakeCloud, kind: str) -> None:
    cloud.on("POST", "/v1/artifacts/a1/*", ARTIFACT)
    openui = cloud.client(kind)
    await settle(openui.artifacts.share("a1", user="u2", access="edit", user_id="u1"))
    await settle(openui.artifacts.unshare("a1", group="g1"))
    assert [s.body for s in cloud.sent] == [
        {"type": "user", "id": "u2", "access": "edit"},
        {"type": "group", "id": "g1"},
    ]


async def test_groups_need_a_user(cloud: FakeCloud, kind: str) -> None:
    with pytest.raises(OpenUIApiError) as error:
        await settle(cloud.client(kind).artifacts.get("a1", group_ids=["g1"]))
    assert error.value.code == "invalid_input"
