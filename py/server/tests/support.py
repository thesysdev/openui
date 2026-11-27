"""A fake OpenUI Cloud for the tests: it answers by route and records every request."""

from __future__ import annotations

import inspect
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from openui_server import AsyncOpenUIClient, OpenUIClient

GOLDEN = json.loads((Path(__file__).parent / "fixtures" / "ts_parity.json").read_text())
"""Outputs of the TypeScript @openuidev/server on the same inputs."""


@dataclass
class Sent:
    method: str
    path: str
    raw_path: bytes
    query: dict[str, list[str]]
    body: Any
    headers: httpx.Headers


class FakeCloud:
    """Routes are `(method, path)`; a path ending in `*` matches a prefix. Each route answers with
    its responses in turn, repeating the last. A response is a JSON value, an `httpx.Response`, or
    a function of the request returning either."""

    def __init__(self) -> None:
        self.sent: list[Sent] = []
        self._routes: list[tuple[str, str, list[Any]]] = []

    def on(self, method: str, path: str, *responses: Any) -> FakeCloud:
        self._routes.append((method, path, list(responses)))
        return self

    def __call__(self, request: httpx.Request) -> httpx.Response:
        query: dict[str, list[str]] = {}
        for name, value in request.url.params.multi_items():
            query.setdefault(name, []).append(value)
        body = json.loads(request.content) if request.content else None
        self.sent.append(
            Sent(
                request.method, request.url.path, request.url.raw_path, query, body, request.headers
            )
        )
        for method, path, responses in self._routes:
            prefix = path.endswith("*") and request.url.path.startswith(path[:-1])
            if method == request.method and (path == request.url.path or prefix):
                response = responses.pop(0) if len(responses) > 1 else responses[0]
                if callable(response):
                    response = response(request)
                if isinstance(response, httpx.Response):
                    return response
                return httpx.Response(200, json=response)
        message = f"No route for {request.method} {request.url.path}"
        return httpx.Response(404, json={"error": {"code": "not_found", "message": message}})

    def client(self, kind: str, **options: Any) -> Any:
        """An `OpenUIClient` (`kind="sync"`) or `AsyncOpenUIClient` on this fake."""
        options.setdefault("api_key", "sk_test")
        options.setdefault("base_url", "https://cloud.test")
        transport = httpx.MockTransport(self)
        if kind == "sync":
            return OpenUIClient(http_client=httpx.Client(transport=transport), **options)
        return AsyncOpenUIClient(http_client=httpx.AsyncClient(transport=transport), **options)

    @property
    def last(self) -> Sent:
        return self.sent[-1]


async def settle(value: Any) -> Any:
    """A sync client's result as is, an async client's awaited."""
    return await value if inspect.isawaitable(value) else value


async def drain(value: Any) -> list[Any]:
    """Everything a sync or async iterator yields."""
    value = await settle(value)
    if hasattr(value, "__aiter__"):
        return [item async for item in value]
    return list(value)


def sse(*events: Any) -> httpx.Response:
    """An SSE response with these events, then `[DONE]`."""
    text = "".join(f"data: {json.dumps(event)}\n\n" for event in events) + "data: [DONE]\n\n"
    return httpx.Response(200, text=text, headers={"content-type": "text/event-stream"})
