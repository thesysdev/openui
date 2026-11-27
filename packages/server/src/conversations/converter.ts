import type { ConversationContentPart, ConversationItem, ConversationItemInput } from "./types";

/** Turns one SDK's messages into conversation items, and stored items back into them. */
export abstract class ConversationItemConverter<Input, Output = Input> {
  /** A new turn as items to store. */
  abstract toItems(messages: readonly Input[]): ConversationItemInput[];

  /** Stored items, oldest first, as messages for the model. */
  abstract fromItems(items: readonly ConversationItem[]): Output[];
}

/** A content part's text, or "". */
export const textOf = (part: ConversationContentPart) =>
  typeof part.text === "string" ? part.text : "";

/** A tool result's output as text. */
export function toolOutputText(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.map(textOf).join("");
  return JSON.stringify(output ?? "");
}

/** Call ids stored with both their call and its result: models reject either one alone. */
export function pairedCallIds(items: readonly ConversationItem[]): Set<string> {
  const calls = new Set<string>();
  const results = new Set<string>();
  for (const item of items) {
    if (item.type === "function_call") calls.add(item.call_id);
    else if (item.type === "function_call_output") results.add(item.call_id);
  }
  return new Set([...calls].filter((id) => results.has(id)));
}
