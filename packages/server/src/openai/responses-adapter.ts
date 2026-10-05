import type {
  ResponseStreamEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
} from "openai/resources/responses/responses";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "../shared/types";
import { isUIOutput, splitClosedFence, unwrapOpenUIFence } from "../shared/utils";

const TOOL_ITEM_TYPES = new Set([
  "function_call",
  "function_call_output",
  "web_search_call",
  "mcp_call",
  "mcp_list_tools",
  "file_search_call",
  "computer_call",
]);

/** Create a text delta with the original item's routing fields. */
export function correctionDelta(
  template: ResponseTextDeltaEvent | ResponseTextDoneEvent,
  delta: string,
): ResponseTextDeltaEvent {
  if (template.type === "response.output_text.delta") return { ...template, delta, logprobs: [] };
  return {
    type: "response.output_text.delta",
    item_id: template.item_id,
    output_index: template.output_index,
    content_index: template.content_index,
    sequence_number: template.sequence_number,
    logprobs: [],
    delta,
  };
}

function isToolItemType(type: string | undefined): boolean {
  return type != null && TOOL_ITEM_TYPES.has(type);
}

/** Preserve Responses events and repair text before a successful response closes. */
export const openAIResponsesAdapter: StreamAdapter<ResponseStreamEvent> = {
  protocol: "openai-responses",
  // Track text within each output item and wait for completed before attempting repair.
  async *transform(source, fix) {
    const texts = new Map<string, string | null>();
    const closings = new Map<string, string>();
    const templates = new Map<string, ResponseTextDeltaEvent | ResponseTextDoneEvent>();
    let held: ResponseStreamEvent[] = [];
    let hasTools = false;
    let failed = false;

    // Release deferred endings, optionally inserting a repair before a held closing fence.
    async function* release(repair = false): AsyncGenerator<ResponseStreamEvent> {
      for (const event of held) {
        // Insert repair and closer just before the text part ends.
        if (event.type === "response.output_text.done") {
          const text = texts.get(event.item_id);
          // Repair only a successful final-item UI generation.
          if (repair && text != null && isUIOutput(text)) {
            const result = await fix(text);
            // Only append when Autofix actually changed the text.
            if (result.status === "fixed") {
              yield correctionDelta(
                templates.get(event.item_id) ?? event,
                `\n${unwrapOpenUIFence(result.content)}\n`,
              );
            }
          }
          const closing = closings.get(event.item_id);
          // Emit the held fence closer after any repair.
          if (closing) yield correctionDelta(templates.get(event.item_id) ?? event, closing);
        }
        yield event;
      }
      held = [];
      texts.clear();
      closings.clear();
      templates.clear();
    }

    for await (const event of source) {
      // Tools mean this response is not the final UI answer.
      if (event.type === "response.output_item.added" && isToolItemType(event.item.type)) {
        hasTools = true;
      }
      if (
        event.type === "response.function_call_arguments.delta" ||
        event.type === "response.mcp_call_arguments.delta"
      ) {
        hasTools = true;
      }
      // Failed or incomplete run; flush held events without repair.
      if (
        event.type === "error" ||
        event.type === "response.failed" ||
        event.type === "response.incomplete"
      ) {
        failed = true;
        yield* release();
        yield event;
        continue;
      }
      // Accumulate text and maybe hold a closing fence.
      if (event.type === "response.output_text.delta") {
        // A new text item; the previous one was not the final answer.
        if (!texts.has(event.item_id) && held.length) yield* release();
        templates.set(event.item_id, event);
        const previous = texts.get(event.item_id);
        if (previous === undefined) texts.set(event.item_id, "");
        const tracked = texts.get(event.item_id);
        // Still tracking this text part.
        if (tracked != null) {
          const combined = tracked + event.delta;
          // Too large to send to Autofix; stop holding.
          if (combined.length > MAX_AUTOFIX_GENERATION_LENGTH) {
            texts.set(event.item_id, null);
            const closing = closings.get(event.item_id);
            closings.delete(event.item_id);
            yield closing ? { ...event, delta: closing + event.delta } : event;
            continue;
          }
          texts.set(event.item_id, combined);
          const split = splitClosedFence(combined);
          // Hold the closing fence so a later repair stays inside it.
          if (split) {
            closings.set(event.item_id, split.closing);
            const emit = split.body.slice(tracked.length);
            // Emit the body slice if anything remains after holding the closer.
            if (emit) yield { ...event, delta: emit };
            continue;
          }
          closings.delete(event.item_id);
        }
        yield event;
        continue;
      }
      // Hold the text closer until the response finishes.
      if (event.type === "response.output_text.done") {
        templates.set(event.item_id, event);
        held.push(event);
        continue;
      }
      // Hold trailing item-close events that follow text.done.
      if (
        held.length &&
        (event.type === "response.content_part.done" || event.type === "response.output_item.done")
      ) {
        held.push(event);
        continue;
      }
      // Stream done; repair only on a clean complete without tools or errors.
      if (event.type === "response.completed") {
        yield* release(!failed && !hasTools);
        yield event;
        continue;
      }
      yield event;
    }
    // EOF without a successful complete preserves events without attempting repair.
    yield* release();
  },
};
