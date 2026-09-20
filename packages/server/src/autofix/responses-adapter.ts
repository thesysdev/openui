import type { ResponseOutputItem, ResponseStreamEvent } from "openai/resources/responses/responses";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "./types";
import { isUIOutput } from "./utils";

// Update completed message snapshots to match the original text plus appended repairs.
function correctedItem(
  item: ResponseOutputItem,
  corrections: Map<string, string>,
): ResponseOutputItem {
  if (item.type !== "message") return item;
  let changed = false;
  const content = item.content.map((part, index) => {
    const text = corrections.get(`${item.id}:${index}`);
    if (part.type !== "output_text" || text === undefined) return part;
    changed = true;
    return { ...part, text, logprobs: [] };
  });
  return changed ? { ...item, content } : item;
}

/** Preserve Responses events and append repairs before their text is finalized. */
export const responsesAdapter: StreamAdapter<ResponseStreamEvent, ResponseStreamEvent> = {
  protocol: "responses",
  // Validate completed message text and keep all final snapshots consistent with repairs.
  async *transform(source, fix) {
    const corrections = new Map<string, string>();
    const held = new Map<string, ResponseStreamEvent[]>();
    let nextSequence = 0;

    // Preserve event order after adding corrections or deferring finalization events.
    const ordered = (event: ResponseStreamEvent): ResponseStreamEvent => {
      const sequence = Math.max(nextSequence, event.sequence_number);
      nextSequence = sequence + 1;
      return sequence === event.sequence_number ? event : { ...event, sequence_number: sequence };
    };

    // Release deferred text snapshots with the same content as the emitted deltas.
    function* release(id: string): Generator<ResponseStreamEvent> {
      for (let event of held.get(id) ?? []) {
        if (
          event.type === "response.output_text.done" ||
          event.type === "response.content_part.done"
        ) {
          const text = corrections.get(`${event.item_id}:${event.content_index}`);
          if (text !== undefined) {
            if (event.type === "response.output_text.done")
              event = { ...event, text, logprobs: [] };
            else if (event.part.type === "output_text")
              event = { ...event, part: { ...event.part, text, logprobs: [] } };
          }
        }
        yield ordered(event);
      }
      held.delete(id);
    }

    for await (const event of source) {
      if (
        event.type === "response.output_text.done" ||
        (event.type === "response.content_part.done" && event.part.type === "output_text")
      ) {
        const pending = held.get(event.item_id) ?? [];
        pending.push(event);
        held.set(event.item_id, pending);
        continue;
      }
      if (event.type === "response.output_item.done") {
        const item = event.item;
        if (
          item.type === "message" &&
          item.status === "completed" &&
          !item.content.some((part) => part.type === "refusal")
        ) {
          for (const [index, part] of item.content.entries()) {
            if (
              part.type !== "output_text" ||
              part.text.length > MAX_AUTOFIX_GENERATION_LENGTH ||
              !isUIOutput(part.text)
            )
              continue;
            const result = await fix(part.text);
            if (result.status === "fixed") {
              const delta = `\n${result.content}\n`;
              corrections.set(`${item.id}:${index}`, part.text + delta);
              yield ordered({
                type: "response.output_text.delta",
                item_id: item.id,
                output_index: event.output_index,
                content_index: index,
                delta,
                logprobs: [],
                sequence_number: event.sequence_number,
              });
            }
          }
        }
        yield* release(item.id ?? "");
        const updated = correctedItem(item, corrections);
        yield ordered(updated === item ? event : { ...event, item: updated });
      } else if (
        event.type === "response.completed" ||
        event.type === "response.failed" ||
        event.type === "response.incomplete" ||
        event.type === "error"
      ) {
        // Missing item completion never triggers repair, even if the response has finished.
        for (const id of held.keys()) yield* release(id);
        if (event.type === "error") yield ordered(event);
        else {
          const output = event.response.output.map((item) => correctedItem(item, corrections));
          const changed = output.some((item, index) => item !== event.response.output[index]);
          yield ordered(changed ? { ...event, response: { ...event.response, output } } : event);
        }
      } else yield ordered(event);
    }
    // Preserve finalization events on an unfinished source without attempting repair.
    for (const id of held.keys()) yield* release(id);
  },
};
