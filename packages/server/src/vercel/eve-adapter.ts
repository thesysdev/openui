import type { MessageStreamEvent } from "eve/client";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "../shared/types";
import { isUIOutput, splitClosedFence, unwrapOpenUIFence } from "../shared/utils";

type EveStreamEvent = MessageStreamEvent;
type TextEvent = Extract<EveStreamEvent, { type: "message.appended" | "message.completed" }>;

function isTextEvent(event: EveStreamEvent): event is TextEvent {
  return event.type === "message.appended" || event.type === "message.completed";
}

function stepOf(event: EveStreamEvent): number {
  return isTextEvent(event) ? event.data.stepIndex : 0;
}

function appended(
  template: EveStreamEvent | undefined,
  step: number,
  messageDelta: string,
): EveStreamEvent {
  const text = template && isTextEvent(template) ? template : undefined;
  return {
    type: "message.appended",
    data: {
      messageDelta,
      sequence: text?.data.sequence ?? 0,
      stepIndex: step,
      turnId: text?.data.turnId ?? "",
    },
    meta: text?.meta ?? { at: "", id: "" },
  };
}

/** Preserve Eve NDJSON events and repair text before a successful turn closes. */
export const eveStreamAdapter: StreamAdapter<EveStreamEvent> = {
  protocol: "eve",
  // Track text within each step and wait for the turn boundary before attempting repair.
  async *transform(source, fix) {
    const texts = new Map<number, string | null>();
    const closings = new Map<number, string>();
    const templates = new Map<number, EveStreamEvent>();
    let held: EveStreamEvent[] = [];
    let hasTools = false;
    let failed = false;
    let attempted = false;

    // Release deferred endings, optionally inserting a repair before a held closing fence.
    async function* release(repair = false): AsyncGenerator<EveStreamEvent> {
      for (const event of held) {
        // Insert repair and closer just before the assistant message completes.
        if (event.type === "message.completed") {
          const step = stepOf(event);
          const text = texts.get(step);
          // Repair only a successful final-step UI generation.
          if (repair && text != null && isUIOutput(text)) {
            const result = await fix(text);
            // Only append when Autofix actually changed the text.
            if (result.status === "fixed") {
              yield appended(templates.get(step), step, `\n${unwrapOpenUIFence(result.content)}\n`);
            }
          }
          const closing = closings.get(step);
          // Emit the held fence closer after any repair.
          if (closing) yield appended(templates.get(step), step, closing);
        }
        yield event;
      }
      held = [];
      texts.clear();
      closings.clear();
      templates.clear();
    }

    for await (const event of source) {
      // Tools mean this turn is not the final UI answer.
      if (event.type === "actions.requested") {
        if (event.data.actions.some((action) => action.kind === "tool-call")) hasTools = true;
      }
      // Failed or cancelled turn; flush held events without repair.
      if (
        event.type === "turn.failed" ||
        event.type === "session.failed" ||
        event.type === "step.failed" ||
        event.type === "turn.cancelled"
      ) {
        failed = true;
        yield* release();
        yield event;
        continue;
      }
      // Accumulate text and maybe hold a closing fence.
      if (event.type === "message.appended") {
        const step = event.data.stepIndex;
        const incoming = event.data.messageDelta;
        templates.set(step, event);
        if (!texts.has(step)) texts.set(step, "");
        const previous = texts.get(step);
        // Still tracking this step.
        if (previous != null) {
          const combined = previous + incoming;
          // Too large to send to Autofix; stop holding.
          if (combined.length > MAX_AUTOFIX_GENERATION_LENGTH) {
            texts.set(step, null);
            const closing = closings.get(step);
            closings.delete(step);
            yield closing
              ? { ...event, data: { ...event.data, messageDelta: closing + incoming } }
              : event;
            continue;
          }
          texts.set(step, combined);
          const split = splitClosedFence(combined);
          // Hold the closing fence so a later repair stays inside it.
          if (split) {
            closings.set(step, split.closing);
            const emit = split.body.slice(previous.length);
            // Emit the body slice if anything remains after holding the closer.
            if (emit) yield { ...event, data: { ...event.data, messageDelta: emit } };
            continue;
          }
          closings.delete(step);
        }
        yield event;
        continue;
      }
      // Hold the message closer until the turn finishes; stream a non-delta body first.
      if (event.type === "message.completed") {
        const step = event.data.stepIndex;
        const existing = texts.get(step);
        if (existing == null || existing === "") {
          const full = event.data.message ?? "";
          texts.set(step, full);
          const split = splitClosedFence(full);
          if (split) {
            closings.set(step, split.closing);
            if (split.body) yield appended(event, step, split.body);
          } else if (full) {
            yield appended(event, step, full);
          }
        }
        held.push(event);
        continue;
      }
      // Turn or session success; repair once on a clean finish without tools or errors.
      if (event.type === "turn.completed" || event.type === "session.completed") {
        if (!attempted) {
          yield* release(!failed && !hasTools);
          attempted = true;
        } else {
          yield* release();
        }
        yield event;
        continue;
      }
      // Waiting is a turn boundary without success; preserve events without repair.
      if (event.type === "session.waiting") {
        yield* release();
        yield event;
        continue;
      }
      yield event;
    }
    // EOF without a successful boundary preserves events without attempting repair.
    yield* release();
  },
};
