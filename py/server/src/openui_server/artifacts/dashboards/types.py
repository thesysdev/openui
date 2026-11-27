"""Dashboard settings (`artifacts/dashboards/types.ts`)."""

from __future__ import annotations

from typing import (
    TYPE_CHECKING,
    Literal,
)

if TYPE_CHECKING:
    pass


ReasoningEffort = Literal["minimal", "low", "medium", "high"]
