"""Saved artifacts, as the client returns them (`artifacts/types.ts`)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import (
    TYPE_CHECKING,
    Literal,
)

if TYPE_CHECKING:
    pass


ArtifactKind = Literal["dashboard", "slides", "report"]


ShareAccess = Literal["view", "edit"]


@dataclass(frozen=True, slots=True)
class ArtifactShare:
    """One share on an artifact."""

    type: Literal["user", "group"]
    id: str
    access: ShareAccess
    created_by: str
    """Who shared it: a user id, or your org id for the API key alone."""
    created_at: datetime


@dataclass(frozen=True, slots=True)
class Artifact:
    """A saved artifact. Dashboards hold only their layout: scripts stay in OpenUI Cloud."""

    id: str
    kind: ArtifactKind
    content: str
    """The openui-lang program, ready for the renderer."""
    pinned: bool
    """Whether the user pinned it. Always False for your org, which has no pins."""
    is_owner: bool
    """Whether the user made it. Always False for your org."""
    is_editable: bool
    """Whether the caller can edit, rename and share it. Always True for your org."""
    created_at: datetime
    name: str | None = None
    version: str | None = None
    shares: list[ArtifactShare] | None = None
    """Who it's shared with. Only when `is_editable`."""
    conversation_id: str | None = None
    user_id: str | None = None
    """The user it was made for. None when your org made it without one."""
    app_id: str | None = None
    updated_at: datetime | None = None
