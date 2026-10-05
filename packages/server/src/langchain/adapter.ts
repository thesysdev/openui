import type { AIMessage, MessagesTupleStreamEvent } from "@langchain/langgraph-sdk";
import { MAX_AUTOFIX_GENERATION_LENGTH, type StreamAdapter } from "../shared/types";
import { isUIOutput, splitClosedFence, unwrapOpenUIFence } from "../shared/utils";
import type { LangGraphStreamEvent } from "./types";

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function textContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part: unknown) => {
      const block = record(part);
      return block?.["type"] === "text" && typeof block["text"] === "string" ? block["text"] : "";
    })
    .join("");
}

function hasItems(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

type Message = {
  key: string;
  text: string | null;
  emitted: number;
  closing?: string;
  template: LangGraphStreamEvent;
  payload: AIMessage;
  metadata: MessagesTupleStreamEvent["data"][1];
  hasTools: boolean;
  failed: boolean;
};

/** Emit a text-only delta with the same message identity and graph routing metadata. */
function delta(message: Message, content: string): LangGraphStreamEvent {
  const payload = {
    type: "ai",
    ...(message.payload.id !== undefined && { id: message.payload.id }),
    content,
  };
  return {
    event: message.template.event,
    data: [payload, message.metadata],
  };
}

/** Repair the final assistant message before end or clean EOF; preserve all other events. */
export const langGraphAdapter: StreamAdapter<LangGraphStreamEvent> = {
  protocol: "langgraph",
  async *transform(source, fix) {
    let current: Message | undefined;
    let failed = false;

    async function* release(repair = false): AsyncGenerator<LangGraphStreamEvent> {
      if (!current) return;
      if (repair && !failed && !current.failed && !current.hasTools && current.text != null) {
        if (isUIOutput(current.text)) {
          const result = await fix(current.text);
          if (result.status === "fixed") {
            yield delta(current, `\n${unwrapOpenUIFence(result.content)}\n`);
          }
        }
      }
      if (current.closing) yield delta(current, current.closing);
      current = undefined;
    }

    for await (const event of source) {
      if (event.event === "metadata") {
        yield* release();
        failed = false;
      }
      if (
        event.event === "error" ||
        (event.event === "updates" && record(event.data)?.["__interrupt__"] !== undefined)
      ) {
        failed = true;
        yield* release();
      }
      if (event.event === "end") {
        yield* release(true);
        yield event;
        continue;
      }
      if (event.event !== "messages") {
        yield event;
        continue;
      }

      const parts: unknown[] | undefined = Array.isArray(event.data) ? event.data : undefined;
      const wireMessage = record(parts?.[0]);
      const routing = record(parts?.[1]);
      if (!wireMessage || !routing) {
        yield event;
        continue;
      }
      if (wireMessage["type"] !== "ai") {
        // A tool result closes the preceding model turn without repairing it.
        if (wireMessage["type"] === "tool") yield* release();
        yield event;
        continue;
      }
      const [payload, metadata] = event.data as MessagesTupleStreamEvent["data"] &
        [AIMessage, unknown];

      const key = JSON.stringify([
        payload.id,
        routing?.["langgraph_step"],
        routing?.["langgraph_node"],
        routing?.["langgraph_checkpoint_ns"],
      ]);
      if (current && current.key !== key) yield* release();
      current ??= {
        key,
        text: "",
        emitted: 0,
        template: event,
        payload,
        metadata,
        hasTools: false,
        failed: false,
      };
      current.template = event;
      current.payload = payload;
      current.metadata = metadata;
      current.hasTools ||=
        hasItems(payload.tool_calls) ||
        hasItems(wireMessage["tool_call_chunks"]) ||
        hasItems(payload.invalid_tool_calls) ||
        hasItems(record(payload.additional_kwargs)?.["tool_calls"]);
      const responseMetadata = record(payload.response_metadata);
      const finish = responseMetadata?.["finish_reason"] ?? responseMetadata?.["stop_reason"];
      current.failed ||=
        (finish != null && !["stop", "end_turn", "STOP"].includes(String(finish))) ||
        record(payload.additional_kwargs)?.["refusal"] != null;

      const incoming = textContent(payload.content);
      const previous = current.text;
      if (previous != null) {
        const combined = previous + incoming;
        if (combined.length > MAX_AUTOFIX_GENERATION_LENGTH) {
          current.text = null;
          if (current.closing) yield delta(current, current.closing);
          current.closing = undefined;
        } else {
          current.text = combined;
          const split = splitClosedFence(combined);
          // Hold one or two trailing backticks too: the closer can span token chunks.
          const body =
            split?.body ??
            (combined.includes("```openui") ? combined.replace(/`{1,2}$/, "") : combined);
          const closing = combined.slice(body.length);
          if (closing || current.closing) {
            // A held partial closer that became ordinary text must be released first.
            const pending = body.slice(current.emitted, previous.length);
            if (pending) yield delta(current, pending);
            current.closing = closing || undefined;
            current.emitted = body.length;
            // Preserve non-text content blocks while holding the UI closing fence.
            let remaining = Math.max(0, body.length - previous.length);
            const content =
              typeof payload.content === "string"
                ? body.slice(previous.length)
                : (payload.content as unknown[]).map((part: unknown) => {
                    const block = record(part);
                    if (block?.["type"] !== "text") return part;
                    const text = textContent([part]);
                    const emit = text.slice(0, remaining);
                    remaining -= emit.length;
                    return { ...block, text: emit };
                  });
            yield {
              ...event,
              data: [{ ...payload, content }, metadata],
            };
            continue;
          }
          current.emitted = combined.length;
        }
      }
      yield event;
    }
    yield* release(true);
  },
};
