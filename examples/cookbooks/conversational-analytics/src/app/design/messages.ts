import type { AssistantMessage, Message } from "@openuidev/react-headless";

/*
 * Message helpers for the Radio chat, mirroring what OpenUI's AgentInterface does
 * internally: messages can carry an inline content/context envelope (a follow-up
 * click sends its label as content and the form state as context), and a turn is
 * a user message followed by every assistant and tool message until the next one.
 */

const SENTINEL = "]]>openui:";
const CONTENT = `${SENTINEL}content`;
const CONTEXT = `${SENTINEL}context`;
const END = `${SENTINEL}end`;

const dropNewline = (s: string) => s.replace(/\r?\n$/, "");
const afterLine = (raw: string, at: number) => {
  const eol = raw.indexOf("\n", at);
  return eol === -1 ? raw.length : eol + 1;
};

/** Splits a message body into what's shown and the JSON context carried with it. */
export function splitContent(raw: string): { content: string; context: string | null; header?: string } {
  let text = raw;
  for (let at = text.indexOf(END); at !== -1; at = text.indexOf(END)) {
    const eol = text.indexOf("\n", at);
    const before = dropNewline(text.slice(0, at));
    const after = eol === -1 ? "" : text.slice(eol + 1);
    text = after ? `${before}\n${after}` : before;
  }
  const ci = text.lastIndexOf(CONTENT);
  const xi = text.lastIndexOf(CONTEXT);
  let out: { content: string; context: string | null; header?: string };
  if (ci === -1 && xi === -1) out = { content: text, context: null };
  else if (ci === -1) out = { content: dropNewline(text.slice(0, xi)), context: text.slice(afterLine(text, xi)) };
  else {
    const header = text.slice(ci, afterLine(text, ci)).replace(/\n$/, "");
    const hasContext = xi > ci;
    out = {
      content: hasContext ? dropNewline(text.slice(afterLine(text, ci), xi)) : text.slice(afterLine(text, ci)),
      context: hasContext ? text.slice(afterLine(text, xi)) : null,
      header,
    };
  }
  // Mid-stream, a marker can arrive half-written at the end. Hold it back.
  for (const token of [CONTENT, CONTEXT, END])
    for (let k = token.length - 1; k > 0; k--)
      if (out.content.endsWith(token.slice(0, k))) {
        out.content = dropNewline(out.content.slice(0, -k));
        break;
      }
  return out;
}

export const wrapContent = (text: string, header?: string) => `${header ?? CONTENT}\n${text}`;
export const wrapContext = (json: string) => `\n${CONTEXT}\n${json}`;

/** Plain text of a message's content, envelope removed. */
export function messageText(content: Message["content"]): string {
  if (typeof content === "string") return splitContent(content).content;
  if (Array.isArray(content))
    return content
      .map((part) => (part && typeof part === "object" && "text" in part ? String(part.text) : ""))
      .join(" ");
  return "";
}

/** Whether an answer has started writing OpenUI Lang (a fence or a root binding). */
export const hasLangSyntax = (content: string) =>
  !!content && (content.includes("```openui-lang") || /(^|\n)\s*root\s*=/.test(content));

export type Turn =
  | { kind: "user"; message: Message }
  | { kind: "assistant"; id: string; segments: AssistantMessage[] };

export function groupIntoTurns(messages: Message[]): Turn[] {
  const turns: Turn[] = [];
  let current: Extract<Turn, { kind: "assistant" }> | null = null;
  for (const message of messages) {
    if (message.role === "assistant" || message.role === "tool") {
      if (!current) {
        current = { kind: "assistant", id: message.id, segments: [] };
        turns.push(current);
      }
      if (message.role === "assistant") current.segments.push(message as AssistantMessage);
    } else {
      current = null;
      if (message.role === "user") turns.push({ kind: "user", message });
    }
  }
  return turns;
}

/** The assistant message that is streaming right now, if the thread ends in one. */
export function lastAssistantId(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const role = messages[i]?.role;
    if (role === "assistant") return messages[i].id;
    if (role === "user") return null;
  }
  return null;
}
