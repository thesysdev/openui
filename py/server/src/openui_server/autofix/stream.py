"""Streams with repairs inserted (`autofix/stream.ts`)."""

from __future__ import annotations

import asyncio
from collections.abc import (
    AsyncIterable,
    AsyncIterator,
    Callable,
    Iterable,
    Iterator,
)
from typing import TYPE_CHECKING, Any, Generic, TypeVar

if TYPE_CHECKING:
    pass
from .sse import chunk_json
from .types import AutofixError, AutofixResult, StreamAdapter

ChunkT = TypeVar("ChunkT")


def _failed_stream(result: AutofixResult) -> AutofixError:
    return AutofixError("Could not repair the streamed generation", "fix_failed", None, result)


def _consumed() -> AutofixError:
    return AutofixError("Autofix stream can only be consumed once", "stream_consumed")


class _StreamResult:
    def __init__(self) -> None:
        self._consumed = False
        self._finished = False
        self._last: AutofixResult | None = None
        self._error: BaseException | None = None

    def _stopped(self, error: BaseException) -> None:
        """`result` raises the stream's own error, or `stream_stopped` after an early stop."""
        stopped = isinstance(error, GeneratorExit | asyncio.CancelledError)
        self._error = (
            AutofixError("Stream consumer stopped", "stream_stopped") if stopped else error
        )

    def _start(self) -> None:
        if self._consumed:
            raise _consumed()
        self._consumed = True

    @property
    def result(self) -> AutofixResult | None:
        """The last Autofix result once the stream ended, or None when Autofix didn't run.
        Persist its `content`, not the joined stream text."""
        if self._error is not None:
            raise self._error
        if not self._finished:
            raise AutofixError("Read the stream to its end first", "stream_pending")
        return self._last


class AutofixStream(_StreamResult, Generic[ChunkT]):
    """Chunks with any repair inserted before the final UI choice closes. Read `chunks` or
    `sse()` once."""

    def __init__(
        self,
        source: Iterable[ChunkT],
        fix: Callable[[str], AutofixResult],
        adapter: Callable[[], StreamAdapter],
    ) -> None:
        super().__init__()
        self._source, self._fix, self._adapter = source, fix, adapter

    @property
    def chunks(self) -> Iterator[ChunkT]:
        self._start()
        return self._run()

    def sse(self) -> Iterator[str]:
        """The chunks as Chat Completions SSE, ending with `data: [DONE]`: return it from your
        route with the `text/event-stream` media type."""
        for chunk in self.chunks:
            yield f"data: {chunk_json(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    def _run(self) -> Iterator[ChunkT]:
        state = self._adapter()
        ended = False
        try:
            for chunk in self._source:
                out, held = state.feed(chunk)
                yield out
                for item in held:
                    text = state.repair_text(item)
                    result = None
                    if text is not None:
                        result = self._last = self._fix(text)
                        if result.status == "fix_failed":
                            raise _failed_stream(result)
                    yield from state.release(chunk, item, result)
            ended = self._finished = True
        except BaseException as error:
            self._stopped(error)
            raise
        finally:
            # An early stop closes the upstream stream too.
            close = getattr(self._source, "close", None)
            if not ended and callable(close):
                close()


class AsyncAutofixStream(_StreamResult, Generic[ChunkT]):
    """`AutofixStream`, for async streams."""

    def __init__(
        self,
        source: AsyncIterable[ChunkT],
        fix: Callable[[str], Any],
        adapter: Callable[[], StreamAdapter],
    ) -> None:
        super().__init__()
        self._source, self._fix, self._adapter = source, fix, adapter

    @property
    def chunks(self) -> AsyncIterator[ChunkT]:
        self._start()
        return self._run()

    async def sse(self) -> AsyncIterator[str]:
        async for chunk in self.chunks:
            yield f"data: {chunk_json(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    async def _run(self) -> AsyncIterator[ChunkT]:
        state = self._adapter()
        ended = False
        try:
            async for chunk in self._source:
                out, held = state.feed(chunk)
                yield out
                for item in held:
                    text = state.repair_text(item)
                    result = None
                    if text is not None:
                        result = self._last = await self._fix(text)
                        if result.status == "fix_failed":
                            raise _failed_stream(result)
                    for released in state.release(chunk, item, result):
                        yield released
            ended = self._finished = True
        except BaseException as error:
            self._stopped(error)
            raise
        finally:
            close = getattr(self._source, "close", None) or getattr(self._source, "aclose", None)
            if not ended and callable(close):
                await close()
