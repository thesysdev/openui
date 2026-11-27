"""Converters between one SDK's messages and conversation items (`conversations/converter.ts`)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Generic, TypeVar

from .types import ConversationItem, ConversationItemInput

In = TypeVar("In")
Out = TypeVar("Out")


class ConversationItemConverter(ABC, Generic[In, Out]):
    """Turns one SDK's messages into conversation items, and stored items back into them.
    Subclass it for another SDK; `chat_completions_converter` and `langgraph_converter` are the
    built-in ones."""

    @abstractmethod
    def to_items(self, messages: Sequence[In]) -> Sequence[ConversationItemInput]:
        """A new turn as items to store."""

    @abstractmethod
    def from_items(self, items: Sequence[ConversationItem]) -> list[Out]:
        """Stored items, oldest first, as messages for the model."""
