"""Autofix on the client: `fix`, and streams with the repair inserted, against TypeScript's output."""

from __future__ import annotations

import copy
import json
from collections.abc import AsyncIterator, Iterator
from typing import Any

import httpx
import pytest
from openai.types.chat import ChatCompletionChunk
from support import GOLDEN, FakeCloud, settle

from openui_server import AutofixError

CASES = GOLDEN["autofix"]
FIXED = '```openui\nroot = Stack([c1])\nc1 = Card("Fixed", 1)\n```'


def autofix_api(request: httpx.Request) -> httpx.Response:
    """The Autofix API, as the TypeScript run faked it: `zz` can't be fixed, `c2` gets fixed, the
    rest is already valid."""
    generation = json.loads(request.content)["messages"][-1]["content"]
    if "HTTP500" in generation:
        return httpx.Response(500, text="nope")
    if "zz" in generation:
        unfixed = [
            {
                "code": "unresolved",
                "message": 'Reference "zz" is not defined',
                "component": "Stack",
                "path": "/children/0",
                "extra": 1,
            }
        ]
        return httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": None}}],
                "fix_summary": {
                    "status": "fix_failed",
                    "fixed_errors": [],
                    "unfixed_errors": unfixed,
                },
            },
        )
    if "c2" in generation:
        fixed = [
            {"code": "unresolved", "message": 'Reference "c2" is not defined', "statementId": "c2"}
        ]
        return httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": FIXED}}],
                "fix_summary": {"status": "fixed", "fixed_errors": fixed, "unfixed_errors": []},
            },
        )
    return httpx.Response(
        200,
        json={
            "choices": [{"message": {"content": generation}}],
            "fix_summary": {"status": "already_valid", "fixed_errors": [], "unfixed_errors": []},
        },
    )


def make_autofix(cloud: FakeCloud, kind: str, library: dict[str, Any]) -> Any:
    cloud.on("POST", "/v1/autofix", autofix_api)
    return cloud.client(kind).chat.create_autofix(library=library)


def as_typescript(result: Any) -> dict[str, Any] | None:
    """A Python result in TypeScript's camelCase shape."""
    if result is None:
        return None

    def diagnostic(d: Any) -> dict[str, Any]:
        found = {
            "code": d.code,
            "message": d.message,
            "component": d.component,
            "path": d.path,
            "statementId": d.statement_id,
        }
        return {k: v for k, v in found.items() if v is not None}

    return {
        "status": result.status,
        "original": result.original,
        "content": result.content,
        "fixedErrors": [diagnostic(d) for d in result.fixed_errors],
        "unfixedErrors": [diagnostic(d) for d in result.unfixed_errors],
    }


def plain(chunk: Any) -> Any:
    return (
        chunk.model_dump(mode="json", by_alias=True, exclude_unset=True)
        if hasattr(chunk, "model_dump")
        else chunk
    )


def chunks_of(name: str, as_models: bool) -> list[Any]:
    chunks = copy.deepcopy(CASES["cases"][name])
    return [ChatCompletionChunk.model_validate(c) for c in chunks] if as_models else chunks


async def read(autofix: Any, kind: str, chunks: list[Any]) -> tuple[list[Any], str | None, Any]:
    """Reads a wrapped stream to its end: its chunks, its error code, and its result."""

    async def source() -> AsyncIterator[Any]:
        for chunk in chunks:
            yield chunk

    output = autofix.stream(
        stream=source() if kind == "async" else iter(chunks), messages=CASES["history"][:2]
    )
    seen: list[Any] = []
    error = None
    try:
        if kind == "async":
            async for chunk in output.chunks:
                seen.append(plain(chunk))
        else:
            seen.extend(plain(chunk) for chunk in output.chunks)
    except AutofixError as e:
        error = e.code
    try:
        result = as_typescript(output.result)
    except AutofixError as e:
        result = {"rejected": e.code}
    return seen, error, result


@pytest.mark.parametrize("as_models", [False, True], ids=["dicts", "models"])
@pytest.mark.parametrize("name", sorted(CASES["streams"]))
async def test_streams_match_typescript(
    cloud: FakeCloud, kind: str, library: dict[str, Any], name: str, as_models: bool
) -> None:
    autofix = make_autofix(cloud, kind, library)
    chunks, error, result = await read(autofix, kind, chunks_of(name, as_models))
    expected = CASES["streams"][name]
    assert (chunks, error, result) == (expected["chunks"], expected["error"], expected["result"])


async def test_model_chunks_stay_models(cloud: FakeCloud, library: dict[str, Any]) -> None:
    autofix = make_autofix(cloud, "sync", library)
    output = autofix.stream(stream=iter(chunks_of("broken-fenced", as_models=True)))
    assert all(isinstance(chunk, ChatCompletionChunk) for chunk in output.chunks)


async def test_valid_ui_is_still_checked_by_the_api(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    # Python has no OpenUI Lang parser, so a valid program goes to /v1/autofix too.
    autofix = make_autofix(cloud, kind, library)
    _, _, result = await read(autofix, kind, chunks_of("valid-fenced", as_models=False))
    assert result["status"] == "already_valid"
    assert len(cloud.sent) == 1


async def test_text_and_tool_calls_skip_the_api(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    autofix = make_autofix(cloud, kind, library)
    for name in ("prose", "tools", "length-cut"):
        await read(autofix, kind, chunks_of(name, as_models=False))
    assert cloud.sent == []


@pytest.mark.parametrize(
    ("generation", "code"),
    [
        ("root = A()" + "x" * 100_000, "generation_too_large"),
        ("root = Stack([c2]) HTTP500", "http_error"),
    ],
)
async def test_fix_errors(
    cloud: FakeCloud, kind: str, library: dict[str, Any], generation: str, code: str
) -> None:
    autofix = make_autofix(cloud, kind, library)
    with pytest.raises(AutofixError) as error:
        await settle(autofix.fix(generation=generation))
    assert error.value.code == code


async def test_fix_sends_the_library_and_recent_context(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    autofix = make_autofix(cloud, kind, library)
    result = await settle(
        autofix.fix(generation="root = Stack([c1, c2])", messages=CASES["history"])
    )
    assert (result.status, result.content, result.fixed_errors[0].statement_id) == (
        "fixed",
        FIXED,
        "c2",
    )
    roles = [m["role"] for m in cloud.last.body["messages"]]
    # The config block, the last 8,000 characters of text context, then the generation.
    assert roles == ["system", "assistant", "assistant"]
    assert cloud.last.body["messages"][0]["content"].startswith(']]>openui:config\n{"chatLibrary":')


def test_a_library_needs_its_schema(cloud: FakeCloud) -> None:
    with pytest.raises(AutofixError) as error:
        cloud.client("sync").chat.create_autofix(library={"components": {}})
    assert error.value.code == "invalid_library"


def test_a_stream_is_read_once_and_stops_upstream(
    cloud: FakeCloud, library: dict[str, Any]
) -> None:
    autofix = make_autofix(cloud, "sync", library)
    closed: list[bool] = []

    class Upstream:
        def __iter__(self) -> Iterator[dict[str, Any]]:
            for i in range(5):
                yield {
                    "id": "c",
                    "object": "chat.completion.chunk",
                    "created": 1,
                    "model": "m",
                    "choices": [{"index": 0, "delta": {"content": f"t{i}"}, "finish_reason": None}],
                }

        def close(self) -> None:
            closed.append(True)

    output = autofix.stream(stream=Upstream())
    with pytest.raises(AutofixError) as pending:
        _ = output.result
    assert pending.value.code == "stream_pending"

    chunks = output.chunks
    next(chunks)
    chunks.close()
    assert closed == [True]
    with pytest.raises(AutofixError) as stopped:
        _ = output.result
    assert stopped.value.code == "stream_stopped"
    with pytest.raises(AutofixError) as again:
        _ = output.chunks
    assert again.value.code == "stream_consumed"


async def test_sse_frames_each_chunk_then_done(
    cloud: FakeCloud, kind: str, library: dict[str, Any]
) -> None:
    autofix = make_autofix(cloud, kind, library)
    chunks = chunks_of("broken-fenced", as_models=False)

    async def source() -> AsyncIterator[Any]:
        for chunk in chunks:
            yield chunk

    output = autofix.stream(stream=source() if kind == "async" else iter(chunks))
    if kind == "async":
        text = "".join([part async for part in output.sse()])
    else:
        text = "".join(output.sse())
    events = [line[6:] for line in text.split("\n\n") if line.startswith("data: ")]
    assert events[-1] == "[DONE]"
    assert [json.loads(e) for e in events[:-1]] == CASES["streams"]["broken-fenced"]["chunks"]
