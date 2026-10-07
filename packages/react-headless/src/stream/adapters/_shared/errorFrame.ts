import { AGUIEvent, EventType } from "../../../types";

/**
 * Recognise an OpenAI-style error object delivered as a stream record —
 * `{"error":{"message":"…","type":"…","code":"…"}}` — and map it to an AG-UI
 * `RUN_ERROR` event. This is how the OpenAI SDK, OpenRouter and the OpenUI
 * Gateway report a failure that happens after the HTTP 200 headers were sent
 * (a rejected request, an upstream provider error, a post-stream failure).
 *
 * Returns `undefined` for anything that is not an error record, so callers
 * can fall through to their normal parsing.
 *
 * @internal
 */
export function errorFrameToRunError(record: unknown): AGUIEvent | undefined {
  if (!record || typeof record !== "object" || !("error" in record)) return undefined;
  const raw = (record as { error: unknown }).error;

  // Only a real error counts: a non-empty string, or an object carrying a
  // message or a code. A chunk that merely has an `error` field set to
  // false / "" / 0 / {} is not a failure and must keep its content.
  if (typeof raw === "string") {
    return raw.length > 0 ? { type: EventType.RUN_ERROR, message: raw } : undefined;
  }
  if (!raw || typeof raw !== "object") return undefined;

  const { message, code } = raw as { message?: unknown; code?: unknown };
  const hasMessage = typeof message === "string" && message.length > 0;
  const codeText = typeof code === "string" || typeof code === "number" ? String(code) : undefined;
  if (!hasMessage && !codeText) return undefined;

  return {
    type: EventType.RUN_ERROR,
    message: hasMessage ? message : "Stream error",
    ...(codeText ? { code: codeText } : {}),
  };
}
