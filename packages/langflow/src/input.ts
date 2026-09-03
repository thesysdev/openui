import type { Message } from "@ag-ui/core";

const CONTENT_MARKER = "]]\u003eopenui:content";
const CONTEXT_MARKER = "]]\u003eopenui:context";

/**
 * Returns the newest user turn in a form suitable for Langflow's `input_value`.
 *
 * OpenUI action turns include a human-friendly message plus an encoded context
 * block. This function keeps both, including edited form state, while removing
 * the transport markers themselves.
 */
export function toLangflowInput(messages: Message[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    const text = actionAwareUserText(message.content);
    if (text) return text;
  }

  throw new Error("Expected at least one non-empty user message");
}

function rawMessageText(content: Extract<Message, { role: "user" }>["content"]): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("");
}

function actionAwareUserText(content: Extract<Message, { role: "user" }>["content"]): string {
  const raw = rawMessageText(content);
  const contentIndex = raw.lastIndexOf(CONTENT_MARKER);
  const contextIndex = raw.lastIndexOf(CONTEXT_MARKER);
  if (contentIndex === -1 && contextIndex === -1) return raw.trim();

  const contentStart = contentIndex === -1 ? 0 : lineContentStart(raw, contentIndex);
  const contentEnd = contextIndex === -1 ? raw.length : contextIndex;
  const visibleContent = raw.slice(contentStart, contentEnd).trim();
  if (contextIndex === -1) return visibleContent;

  const rawContext = raw.slice(lineContentStart(raw, contextIndex)).trim();
  return [visibleContent, formatActionContext(rawContext)].filter(Boolean).join("\n");
}

function lineContentStart(value: string, markerIndex: number): number {
  const newline = value.indexOf("\n", markerIndex);
  return newline === -1 ? markerIndex : newline + 1;
}

function formatActionContext(rawContext: string): string {
  if (!rawContext) return "";

  try {
    const parsed = JSON.parse(rawContext) as unknown;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter((item): item is string => Boolean(item))
      .join("\n");
  } catch {
    return rawContext;
  }
}
