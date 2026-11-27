"""`fix` and `stream` for one library and one SDK's chunks (`autofix/create-autofix.ts`).

The one difference from TS: TS parses each generation with lang-core's OpenUI Lang parser and
sends only a broken one to `/v1/autofix`. Python has no parser, so every UI generation goes to
`/v1/autofix`, which answers `already_valid` for a valid one. OpenUI Cloud doesn't charge for
those: only a call that ran a repair is billed. The added cost is one request's latency."""

from __future__ import annotations

from collections.abc import AsyncIterable, Callable, Iterable, Mapping, Sequence
from typing import TYPE_CHECKING, Any, Generic, TypeVar

from ..core.errors import OpenUIApiError
from ..core.http import AsyncHttp, SyncHttp
from .diagnostics import read_fix
from .fix import AUTOFIX_ROUTE, autofix_system_block, fix_body
from .stream import AsyncAutofixStream, AutofixStream
from .types import AutofixError, AutofixResult, StreamAdapter

if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionMessageParam

ChunkT = TypeVar("ChunkT")


def _missing_key(error: OpenUIApiError) -> AutofixError:
    return AutofixError(error.message, error.code, error.status)


class Autofix(Generic[ChunkT]):
    """Validates and repairs one SDK's finished or streamed model output, for one library."""

    def __init__(
        self, http: SyncHttp, library: Mapping[str, Any], adapter: Callable[[], StreamAdapter]
    ) -> None:
        self._http, self._adapter = http, adapter
        self._system_block = autofix_system_block(library)

    def fix(
        self,
        *,
        generation: str,
        messages: Sequence[ChatCompletionMessageParam] | None = None,
    ) -> AutofixResult:
        """Checks a finished OpenUI generation, and repairs it when it's invalid. `messages` is
        the conversation before it. Use `content` unless it's None (`fix_failed`)."""
        body = fix_body(self._system_block, generation, messages)
        try:
            response = self._http.post_raw(AUTOFIX_ROUTE, body)
        except OpenUIApiError as error:
            raise _missing_key(error) from None
        return read_fix(response, generation)

    def stream(
        self,
        *,
        stream: Iterable[ChunkT],
        messages: Sequence[ChatCompletionMessageParam] | None = None,
    ) -> AutofixStream[ChunkT]:
        """Wraps a stream. Chunks pass through; when the final UI answer is invalid, its repair is
        inserted before the stream completes. A failed repair raises `AutofixError`
        (`fix_failed`)."""
        return AutofixStream(
            stream, lambda text: self.fix(generation=text, messages=messages), self._adapter
        )


class AsyncAutofix(Generic[ChunkT]):
    """`Autofix`, for asyncio: `await fix(...)`, and `stream(...)` over an async stream."""

    def __init__(
        self, http: AsyncHttp, library: Mapping[str, Any], adapter: Callable[[], StreamAdapter]
    ) -> None:
        self._http, self._adapter = http, adapter
        self._system_block = autofix_system_block(library)

    async def fix(
        self,
        *,
        generation: str,
        messages: Sequence[ChatCompletionMessageParam] | None = None,
    ) -> AutofixResult:
        body = fix_body(self._system_block, generation, messages)
        try:
            response = await self._http.post_raw(AUTOFIX_ROUTE, body)
        except OpenUIApiError as error:
            raise _missing_key(error) from None
        return read_fix(response, generation)

    def stream(
        self,
        *,
        stream: AsyncIterable[ChunkT],
        messages: Sequence[ChatCompletionMessageParam] | None = None,
    ) -> AsyncAutofixStream[ChunkT]:
        return AsyncAutofixStream(
            stream, lambda text: self.fix(generation=text, messages=messages), self._adapter
        )
