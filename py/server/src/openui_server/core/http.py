"""Authenticated requests to OpenUI Cloud with the API key (`core/http.ts`). Everything but the
network call is shared, so the sync and async clients send the same requests."""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator, Callable, Iterator, Mapping, Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Generic, Literal, TypeVar

import httpx

if TYPE_CHECKING:
    pass
from .constants import BASE_URL
from .errors import OpenUIApiError, invalid_response

T = TypeVar("T")


DEFAULT_TIMEOUT = httpx.Timeout(600.0, connect=10.0)


Method = Literal["GET", "POST", "DELETE"]


JsonObject = dict[str, Any]


Query = Mapping[str, str | Sequence[str] | None]
"""Query string values; None ones are left out, lists repeat the name."""


@dataclass(frozen=True, slots=True)
class Call(Generic[T]):
    """One request and how to read its answer: built once, sent by either client."""

    method: Method
    path: str
    parse: Callable[[JsonObject], T]
    query: Query | None = None
    body: JsonObject | None = None


class Cloud:
    """What every request needs: the origin, the API key and the client's app."""

    def __init__(self, api_key: str | None, base_url: str | None, app_id: str | None) -> None:
        self._api_key = api_key
        self.base_url = (base_url or BASE_URL).rstrip("/")
        self.app_id = app_id

    # Read on each request, so creating the client never throws.
    def headers(self, *, stream: bool = False) -> dict[str, str]:
        api_key = self._api_key if self._api_key is not None else os.environ.get("THESYS_API_KEY")
        if not api_key or not api_key.strip():
            raise OpenUIApiError(
                "Set THESYS_API_KEY, or pass api_key to OpenUIClient()", "missing_api_key"
            )
        headers = {"Authorization": f"Bearer {api_key}"}
        if stream:
            headers["Accept"] = "text/event-stream"
        return headers

    def url(self, path: str) -> str:
        return f"{self.base_url}{path}"


def params(query: Query | None) -> list[tuple[str, str | int | float | bool | None]]:
    pairs: list[tuple[str, str | int | float | bool | None]] = []
    for name, value in (query or {}).items():
        if value is None:
            continue
        for item in [value] if isinstance(value, str) else value:
            pairs.append((name, item))
    return pairs


def api_error(response: httpx.Response) -> OpenUIApiError:
    """The error a failed OpenUI Cloud response describes. The body must be read."""
    try:
        result = response.json()
    except ValueError:
        result = None
    body = result if isinstance(result, dict) else {}
    error = body.get("error") if isinstance(body.get("error"), dict) else None
    message = error.get("message") if error is not None else None
    if message is None:
        message = body.get("message")
    code = error.get("code") if error is not None else None
    return OpenUIApiError(
        message
        if isinstance(message, str)
        else f"OpenUI Cloud request failed: HTTP {response.status_code}",
        code if isinstance(code, str) else "http_error",
        response.status_code,
    )


def read_object(response: httpx.Response) -> JsonObject:
    if not response.is_success:
        raise api_error(response)
    try:
        result = response.json()
    except ValueError:
        result = None
    if not isinstance(result, dict):
        raise invalid_response()
    return result


_DONE = object()


def sse_event(line: str) -> JsonObject | object | None:
    """An SSE line's event, `_DONE` at `[DONE]`, or None for a line to skip."""
    line = line.strip()
    if not line.startswith("data:"):
        return None
    data = line[5:].strip()
    if data == "[DONE]":
        return _DONE
    try:
        event = json.loads(data)
    except ValueError:
        raise invalid_response() from None
    return event if isinstance(event, dict) else None


def stream_body(body: JsonObject) -> JsonObject:
    return {**body, "stream": True}


class SyncHttp:
    def __init__(self, cloud: Cloud, client: httpx.Client | None, timeout: Any) -> None:
        self.cloud = cloud
        self._client = client or httpx.Client(timeout=timeout)
        self._owns_client = client is None

    def send(
        self,
        method: Method,
        path: str,
        *,
        query: Query | None = None,
        body: JsonObject | None = None,
        timeout: float | None = None,
    ) -> JsonObject:
        response = self._client.request(
            method,
            self.cloud.url(path),
            params=params(query),
            headers=self.cloud.headers(),
            json=body,
            timeout=timeout if timeout is not None else httpx.USE_CLIENT_DEFAULT,
        )
        return read_object(response)

    def call(self, call: Call[T]) -> T:
        return call.parse(self.send(call.method, call.path, query=call.query, body=call.body))

    def post_raw(self, path: str, body: JsonObject) -> httpx.Response:
        """POSTs JSON and returns the response as is, for callers that read errors their way."""
        return self._client.post(self.cloud.url(path), headers=self.cloud.headers(), json=body)

    def stream(self, path: str, body: JsonObject) -> Iterator[JsonObject]:
        """POSTs with `stream: true` and yields each event, until `[DONE]`. Stopping early
        closes the connection."""
        with self._client.stream(
            "POST",
            self.cloud.url(path),
            headers=self.cloud.headers(stream=True),
            json=stream_body(body),
        ) as response:
            if not response.is_success:
                response.read()
                raise api_error(response)
            for line in response.iter_lines():
                event = sse_event(line)
                if event is _DONE:
                    return
                if isinstance(event, dict):
                    yield event

    def close(self) -> None:
        if self._owns_client:
            self._client.close()


class AsyncHttp:
    def __init__(self, cloud: Cloud, client: httpx.AsyncClient | None, timeout: Any) -> None:
        self.cloud = cloud
        self._client = client or httpx.AsyncClient(timeout=timeout)
        self._owns_client = client is None

    async def send(
        self,
        method: Method,
        path: str,
        *,
        query: Query | None = None,
        body: JsonObject | None = None,
    ) -> JsonObject:
        response = await self._client.request(
            method,
            self.cloud.url(path),
            params=params(query),
            headers=self.cloud.headers(),
            json=body,
        )
        return read_object(response)

    async def call(self, call: Call[T]) -> T:
        return call.parse(await self.send(call.method, call.path, query=call.query, body=call.body))

    async def post_raw(self, path: str, body: JsonObject) -> httpx.Response:
        """POSTs JSON and returns the response as is, for callers that read errors their way."""
        return await self._client.post(
            self.cloud.url(path), headers=self.cloud.headers(), json=body
        )

    async def stream(self, path: str, body: JsonObject) -> AsyncIterator[JsonObject]:
        """POSTs with `stream: true` and yields each event, until `[DONE]`. Stopping early
        closes the connection."""
        async with self._client.stream(
            "POST",
            self.cloud.url(path),
            headers=self.cloud.headers(stream=True),
            json=stream_body(body),
        ) as response:
            if not response.is_success:
                await response.aread()
                raise api_error(response)
            async for line in response.aiter_lines():
                event = sse_event(line)
                if event is _DONE:
                    return
                if isinstance(event, dict):
                    yield event

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()


def json_text(value: Any) -> str:
    """JSON as JavaScript's JSON.stringify writes it."""
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
