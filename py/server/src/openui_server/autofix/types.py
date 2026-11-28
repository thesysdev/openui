"""Autofix results and errors (`autofix/types.ts`)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal, Protocol

if TYPE_CHECKING:
    pass


MAX_AUTOFIX_GENERATION_LENGTH = 100_000


class AutofixError(Exception):
    """A failed Autofix call or stream, with a stable `code`, the HTTP `status` when there is
    one, and the Autofix `result` when a repair ran out of attempts (`fix_failed`)."""

    def __init__(
        self,
        message: str,
        code: str,
        status: int | None = None,
        result: AutofixResult | None = None,
    ) -> None:
        super().__init__(message)
        self.message, self.code, self.status, self.result = message, code, status, result


@dataclass(frozen=True, slots=True)
class AutofixDiagnostic:
    code: str
    message: str
    component: str | None = None
    path: str | None = None
    statement_id: str | None = None


@dataclass(frozen=True, slots=True)
class AutofixResult:
    """`content` is the program to use: the original when `already_valid`, the repair when
    `fixed`, and None when `fix_failed`."""

    status: Literal["already_valid", "fixed", "fix_failed"]
    original: str
    content: str | None
    fixed_errors: list[AutofixDiagnostic]
    unfixed_errors: list[AutofixDiagnostic]


class StreamAdapter(Protocol):
    """One SDK's stream for Autofix (`StreamAdapter` in TS): passes chunks on, and holds a final
    UI answer's ending until Autofix checked it. A new one per stream."""

    def feed(self, chunk: Any) -> tuple[Any, list[Any]]:
        """The chunk to pass on, and the endings it holds back."""
        ...

    def repair_text(self, held: Any) -> str | None:
        """The generation to check for a held ending, if it needs one."""
        ...

    def release(self, template: Any, held: Any, result: AutofixResult | None) -> list[Any]:
        """A held ending's chunks: the repair when there is one, then the ending."""
        ...
