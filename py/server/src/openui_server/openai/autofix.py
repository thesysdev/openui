"""Autofix for Chat Completions responses and streams (`openai/autofix.ts`)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeAlias

from ..autofix.create_autofix import AsyncAutofix, Autofix
from ..core.http import AsyncHttp, SyncHttp
from .adapter import ChunkRepairs

# Autofix for Chat Completions: `fix` a finished generation, or wrap a `stream=True` stream of
# openai-python's chunks (dicts work too).
if TYPE_CHECKING:
    from openai.types.chat import ChatCompletionChunk

    ChatAutofix: TypeAlias = Autofix[ChatCompletionChunk]
    AsyncChatAutofix: TypeAlias = AsyncAutofix[ChatCompletionChunk]
else:
    ChatAutofix, AsyncChatAutofix = Autofix, AsyncAutofix


def chat_autofix(http: SyncHttp, library: Mapping[str, Any]) -> ChatAutofix:
    return Autofix(http, library, ChunkRepairs)


def async_chat_autofix(http: AsyncHttp, library: Mapping[str, Any]) -> AsyncChatAutofix:
    return AsyncAutofix(http, library, ChunkRepairs)
