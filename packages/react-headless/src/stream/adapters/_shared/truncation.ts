import { AGUIEvent, EventType } from "../../../types";

const LENGTH_REASONS = new Set(["length", "max_output_tokens", "max_tokens"]);
const FILTER_REASONS = new Set(["content_filter", "content-filter"]);

/**
 * A `RUN_ERROR` for a response the provider ended before it was complete — a
 * token limit (`length`, `max_output_tokens`) or a content filter.
 *
 * Without it a truncated or filtered answer renders exactly like a finished
 * one. AG-UI has no warning event, so the run error is the signal the UI can
 * show; text that already streamed stays in place above it. `code` carries the
 * provider's own reason so a consumer can tell the cases apart.
 *
 * @internal
 */
export function truncatedRunError(reason: string): AGUIEvent {
  const message = LENGTH_REASONS.has(reason)
    ? "The response was cut off because it reached the maximum output length."
    : FILTER_REASONS.has(reason)
      ? "The response was stopped by the provider's content filter."
      : `The response ended before it was complete (${reason}).`;
  return { type: EventType.RUN_ERROR, message, code: reason };
}
