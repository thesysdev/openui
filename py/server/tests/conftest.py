from __future__ import annotations

import copy
from typing import Any

import pytest
from support import GOLDEN, FakeCloud


@pytest.fixture
def cloud() -> FakeCloud:
    return FakeCloud()


@pytest.fixture(params=["sync", "async"])
def kind(request: pytest.FixtureRequest) -> str:
    """Runs a test against `OpenUIClient` and `AsyncOpenUIClient`."""
    return str(request.param)


@pytest.fixture
def library() -> dict[str, Any]:
    """A library spec, as `openui generate --spec` writes it."""
    return copy.deepcopy(GOLDEN["library"])


@pytest.fixture(autouse=True)
def _no_env_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("THESYS_API_KEY", raising=False)
