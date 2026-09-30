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
  if (raw == null) return undefined;

  const err =
    typeof raw === "object" ? (raw as { message?: unknown; code?: unknown }) : { message: raw };
  const message =
    typeof err.message === "string" && err.message.length > 0
      ? err.message
      : typeof raw === "string" && raw.length > 0
        ? raw
        : "Stream error";
  const code = err.code != null && err.code !== "" ? String(err.code) : undefined;

  return { type: EventType.RUN_ERROR, message, ...(code ? { code } : {}) };
}
