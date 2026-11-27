"""`openui.artifacts` (`artifacts/index.ts`)."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Literal

from ..core.act_as import act_as
from ..core.errors import invalid_input, invalid_response
from ..core.http import AsyncHttp, Call, JsonObject, SyncHttp
from ..core.resource import (
    Order,
    Page,
    compact,
    id_path,
    query_bool,
    query_number,
    timestamp,
    to_page,
)
from .types import Artifact, ArtifactKind, ArtifactShare, ShareAccess


def _to_share(share: Any) -> ArtifactShare:
    if not isinstance(share, dict):
        raise invalid_response()
    return ArtifactShare(
        type=share["type"],
        id=share["id"],
        access=share["access"],
        created_by=share["created_by"],
        created_at=timestamp(share["created_at"]),
    )


def to_artifact(row: Any) -> Artifact:
    if not isinstance(row, dict) or not isinstance(row.get("id"), str):
        raise invalid_response()
    shares = row.get("shares")
    updated_at = row.get("updated_at")
    return Artifact(
        id=row["id"],
        kind=row.get("kind"),  # type: ignore[arg-type]
        name=row.get("name"),
        content=row.get("content"),  # type: ignore[arg-type]
        version=row.get("version"),
        pinned=row.get("pinned") is True,
        is_owner=row.get("is_owner") is True,
        is_editable=row.get("is_editable") is True,
        shares=[_to_share(share) for share in shares] if isinstance(shares, list) else None,
        conversation_id=row.get("conversation_id"),
        user_id=row.get("user_id"),
        app_id=row.get("app_id"),
        created_at=timestamp(row.get("created_at")),
        updated_at=timestamp(updated_at) if updated_at is not None else None,
    )


def _path(id: object, action: str = "") -> str:
    return id_path("artifacts", id, action)


# Checked here: OpenUI Cloud's own check doesn't say which field is wrong.
def _share_target(user: str | None, group: str | None) -> JsonObject:
    target = [("user", user)] if user is not None else []
    target += [("group", group)] if group is not None else []
    if len(target) != 1 or not isinstance(target[0][1], str) or not target[0][1]:
        raise invalid_input("Share with one user= or one group=, as a non-empty id")
    return {"type": target[0][0], "id": target[0][1]}


class ArtifactCalls:
    """Each artifact call, built once for both clients."""

    def __init__(self, app_id: str | None) -> None:
        self._app_id = app_id

    def list(
        self,
        *,
        user_id: str | None,
        group_ids: Sequence[str] | None,
        kind: ArtifactKind | Sequence[ArtifactKind] | None,
        name: str | None,
        pinned: bool | None,
        is_owner: bool | None,
        conversation_id: str | None,
        limit: int | None,
        after: str | None,
        before: str | None,
        order: Order | None,
    ) -> Call[Page[Artifact]]:
        return Call(
            "GET",
            "/v1/artifacts",
            lambda page: to_page(page, to_artifact),
            query={
                **act_as(self._app_id, user_id, group_ids),
                "kind": kind,
                "name": name,
                "pinned": query_bool(pinned),
                "is_owner": query_bool(is_owner),
                "conversation_id": conversation_id,
                "limit": query_number(limit),
                "after": after,
                "before": before,
                "order": order,
            },
        )

    def get(self, id: str, user_id: str | None, group_ids: Sequence[str] | None) -> Call[Artifact]:
        query = act_as(self._app_id, user_id, group_ids)
        return Call("GET", _path(id), to_artifact, query=query)

    # A program is a new version, which OpenUI Cloud numbers; a name alone renames it.
    def update(
        self,
        id: str,
        name: str | None,
        content: str | None,
        user_id: str | None,
        group_ids: Sequence[str] | None,
    ) -> Call[Artifact]:
        query = act_as(self._app_id, user_id, group_ids)
        body = compact(name=name, content=content)
        return Call("POST", _path(id), to_artifact, query=query, body=body)

    def delete(self, id: str, user_id: str | None, group_ids: Sequence[str] | None) -> Call[None]:
        query = act_as(self._app_id, user_id, group_ids)
        return Call("DELETE", _path(id), lambda _: None, query=query)

    def set_pinned(
        self,
        id: str,
        action: Literal["/pin", "/unpin"],
        user_id: str | None,
        group_ids: Sequence[str] | None,
    ) -> Call[Artifact]:
        if user_id is None:
            raise invalid_input("user_id is required: each user pins their own")
        query = act_as(self._app_id, user_id, group_ids)
        return Call("POST", _path(id, action), to_artifact, query=query)

    def share(
        self,
        id: str,
        user: str | None,
        group: str | None,
        access: ShareAccess,
        user_id: str | None,
        group_ids: Sequence[str] | None,
    ) -> Call[Artifact]:
        if access not in ("view", "edit"):
            raise invalid_input('access must be "view" or "edit"')
        body = {**_share_target(user, group), "access": access}
        query = act_as(self._app_id, user_id, group_ids)
        return Call("POST", _path(id, "/share"), to_artifact, query=query, body=body)

    def unshare(
        self,
        id: str,
        user: str | None,
        group: str | None,
        user_id: str | None,
        group_ids: Sequence[str] | None,
    ) -> Call[Artifact]:
        body = _share_target(user, group)
        query = act_as(self._app_id, user_id, group_ids)
        return Call("POST", _path(id, "/unshare"), to_artifact, query=query, body=body)


class Artifacts:
    """Read and manage saved artifacts with the API key. Without `user_id`, calls cover every
    user in your org; with it, they act as that user and get what their frontend token would.
    Take `user_id` and `group_ids` from your session, never from the browser."""

    def __init__(self, http: SyncHttp) -> None:
        self._http = http
        self._calls = ArtifactCalls(http.cloud.app_id)

    def list(
        self,
        *,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
        kind: ArtifactKind | Sequence[ArtifactKind] | None = None,
        name: str | None = None,
        pinned: bool | None = None,
        is_owner: bool | None = None,
        conversation_id: str | None = None,
        limit: int | None = None,
        after: str | None = None,
        before: str | None = None,
        order: Order | None = None,
    ) -> Page[Artifact]:
        """One page of artifacts, newest first unless `order="asc"`. `is_owner` needs `user_id`."""
        return self._http.call(
            self._calls.list(
                user_id=user_id,
                group_ids=group_ids,
                kind=kind,
                name=name,
                pinned=pinned,
                is_owner=is_owner,
                conversation_id=conversation_id,
                limit=limit,
                after=after,
                before=before,
                order=order,
            )
        )

    def get(
        self, id: str, *, user_id: str | None = None, group_ids: Sequence[str] | None = None
    ) -> Artifact:
        return self._http.call(self._calls.get(id, user_id, group_ids))

    def update(
        self,
        id: str,
        *,
        name: str | None = None,
        content: str | None = None,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
    ) -> Artifact:
        """Renames it, or saves an edited program as a new version. Leave out `content` to
        rename only."""
        return self._http.call(self._calls.update(id, name, content, user_id, group_ids))

    def delete(
        self, id: str, *, user_id: str | None = None, group_ids: Sequence[str] | None = None
    ) -> None:
        """Deleted artifacts can't be restored."""
        self._http.call(self._calls.delete(id, user_id, group_ids))

    def pin(self, id: str, *, user_id: str, group_ids: Sequence[str] | None = None) -> Artifact:
        """Pins belong to a user, so pinning needs `user_id`."""
        return self._http.call(self._calls.set_pinned(id, "/pin", user_id, group_ids))

    def unpin(self, id: str, *, user_id: str, group_ids: Sequence[str] | None = None) -> Artifact:
        return self._http.call(self._calls.set_pinned(id, "/unpin", user_id, group_ids))

    def share(
        self,
        id: str,
        *,
        user: str | None = None,
        group: str | None = None,
        access: ShareAccess,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
    ) -> Artifact:
        """Shares it with one `user` or one `group`, or changes the access of one it's already
        shared with. `view` opens and runs it; `edit` also edits, renames and shares it."""
        return self._http.call(self._calls.share(id, user, group, access, user_id, group_ids))

    def unshare(
        self,
        id: str,
        *,
        user: str | None = None,
        group: str | None = None,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
    ) -> Artifact:
        """Removing a share that isn't there does nothing."""
        return self._http.call(self._calls.unshare(id, user, group, user_id, group_ids))


class AsyncArtifacts:
    """`Artifacts`, for `AsyncOpenUIClient`."""

    def __init__(self, http: AsyncHttp) -> None:
        self._http = http
        self._calls = ArtifactCalls(http.cloud.app_id)

    async def list(
        self,
        *,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
        kind: ArtifactKind | Sequence[ArtifactKind] | None = None,
        name: str | None = None,
        pinned: bool | None = None,
        is_owner: bool | None = None,
        conversation_id: str | None = None,
        limit: int | None = None,
        after: str | None = None,
        before: str | None = None,
        order: Order | None = None,
    ) -> Page[Artifact]:
        return await self._http.call(
            self._calls.list(
                user_id=user_id,
                group_ids=group_ids,
                kind=kind,
                name=name,
                pinned=pinned,
                is_owner=is_owner,
                conversation_id=conversation_id,
                limit=limit,
                after=after,
                before=before,
                order=order,
            )
        )

    async def get(
        self, id: str, *, user_id: str | None = None, group_ids: Sequence[str] | None = None
    ) -> Artifact:
        return await self._http.call(self._calls.get(id, user_id, group_ids))

    async def update(
        self,
        id: str,
        *,
        name: str | None = None,
        content: str | None = None,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
    ) -> Artifact:
        return await self._http.call(self._calls.update(id, name, content, user_id, group_ids))

    async def delete(
        self, id: str, *, user_id: str | None = None, group_ids: Sequence[str] | None = None
    ) -> None:
        await self._http.call(self._calls.delete(id, user_id, group_ids))

    async def pin(
        self, id: str, *, user_id: str, group_ids: Sequence[str] | None = None
    ) -> Artifact:
        return await self._http.call(self._calls.set_pinned(id, "/pin", user_id, group_ids))

    async def unpin(
        self, id: str, *, user_id: str, group_ids: Sequence[str] | None = None
    ) -> Artifact:
        return await self._http.call(self._calls.set_pinned(id, "/unpin", user_id, group_ids))

    async def share(
        self,
        id: str,
        *,
        user: str | None = None,
        group: str | None = None,
        access: ShareAccess,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
    ) -> Artifact:
        return await self._http.call(self._calls.share(id, user, group, access, user_id, group_ids))

    async def unshare(
        self,
        id: str,
        *,
        user: str | None = None,
        group: str | None = None,
        user_id: str | None = None,
        group_ids: Sequence[str] | None = None,
    ) -> Artifact:
        return await self._http.call(self._calls.unshare(id, user, group, user_id, group_ids))
