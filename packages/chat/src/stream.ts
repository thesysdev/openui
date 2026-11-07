import type { ParseResult } from "@openuidev/lang-core";
import { createStreamingParser } from "@openuidev/lang-core";
import type { CardElement } from "chat";
import { chatLibrary } from "./library";
import type { ChatLibrary, RenderCardResult } from "./render";
import { renderCard } from "./render";

/** A posted message that can be edited in place; Chat SDK's `SentMessage`. */
export interface EditableMessage {
  edit(message: CardElement | string): Promise<unknown>;
}

/** Where to post the card; Chat SDK's `Thread` or `Channel`. */
export interface CardTarget {
  post(message: CardElement | string): Promise<EditableMessage>;
}

export interface StreamCardOptions {
  /** Defaults to `chatLibrary`. */
  library?: ChatLibrary;
  /** Minimum time between edits while streaming. Raise it if the platform rate-limits edits. Default 300. */
  updateIntervalMs?: number;
}

export interface StreamCardResult extends RenderCardResult {
  /** The full OpenUI Lang the model wrote, for the conversation history. */
  text: string;
  /** The final parse result. */
  result: ParseResult;
  /** The posted message, or undefined if the model wrote nothing. */
  message: EditableMessage | undefined;
}

/**
 * Streams an OpenUI Lang response into a chat thread as a native card.
 *
 * Posts the card once it has content, edits it as components complete, and
 * finishes with the full card. If the model wrote no UI, posts its text instead.
 *
 * ```ts
 * bot.onNewMention(async (thread, message) => {
 *   const { textStream } = streamText({ model, system: chatLibrary.prompt(chatPromptOptions), prompt: message.text });
 *   await streamCard(thread, textStream);
 * });
 * ```
 */
export async function streamCard(
  target: CardTarget,
  textStream: AsyncIterable<string>,
  options: StreamCardOptions = {},
): Promise<StreamCardResult> {
  const library = options.library ?? chatLibrary;
  const interval = options.updateIntervalMs ?? 300;
  const parser = createStreamingParser(library.toJSONSchema(), library.root);

  let message: EditableMessage | undefined;
  let lastSent = "";
  let lastUpdate = 0;
  let pending: Promise<void> | undefined;
  let latest: ParseResult | undefined;

  const send = async (content: CardElement | string) => {
    const serialized = JSON.stringify(content);
    if (serialized === lastSent) return;
    lastSent = serialized;
    lastUpdate = Date.now();
    if (message) await message.edit(content);
    else message = await target.post(content);
  };

  // One edit in flight at a time, always sending the newest parse
  const pump = async () => {
    while (latest) {
      const wait = interval - (Date.now() - lastUpdate);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      const next = latest;
      latest = undefined;
      if (!next) break;
      const { card } = renderCard(next, library);
      if (card && hasContent(card)) await send(card);
    }
  };

  let text = "";
  for await (const chunk of textStream) {
    text += chunk;
    latest = parser.push(chunk);
    pending ??= pump().finally(() => {
      pending = undefined;
    });
  }
  latest = undefined;
  await pending;

  const result = parser.push("", true);
  const rendered = renderCard(result, library);
  if (rendered.card && hasContent(rendered.card)) await send(rendered.card);
  else if (text.trim()) await send(text.trim());
  return { ...rendered, text, result, message };
}

function hasContent(card: CardElement): boolean {
  return Boolean(card.title || card.subtitle || card.imageUrl || card.children.length);
}
