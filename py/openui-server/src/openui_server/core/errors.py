"""Errors every call can raise (`core/errors.ts`)."""

from __future__ import annotations


class OpenUIApiError(Exception):
    """A failed OpenUI Cloud call, with a stable `code` and the HTTP `status` when there is one."""

    def __init__(self, message: str, code: str, status: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status


def invalid_input(message: str) -> OpenUIApiError:
    return OpenUIApiError(message, "invalid_input")


def invalid_response() -> OpenUIApiError:
    return OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502)
