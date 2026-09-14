import { wrapLanguageModel, type LanguageModel } from "ai";

/** Eve renders `clientContext` as this prefix plus a JSON object. */
const CLIENT_CONTEXT_PREFIX = "Client context:\n";

type PromptMessage = { role: string; content: unknown };

function userText(message: PromptMessage): string {
  if (message.role !== "user") return "";
  const content = message.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) =>
      part && typeof part === "object" && "type" in part && part.type === "text" && "text" in part
        ? String((part as { text: unknown }).text ?? "")
        : "",
    )
    .join("");
}

function isClientContext(message: PromptMessage): boolean {
  return userText(message).startsWith(CLIENT_CONTEXT_PREFIX);
}

function conversationIdFrom(prompt: readonly PromptMessage[]): string {
  for (const message of prompt) {
    if (!isClientContext(message)) continue;
    try {
      const id = JSON.parse(userText(message).slice(CLIENT_CONTEXT_PREFIX.length)).conversationId;
      if (typeof id === "string" && id) return id;
    } catch {
      // ignore malformed client context
    }
  }
  return "";
}

function openaiOptions(params: { providerOptions?: unknown }): Record<string, unknown> {
  const providerOptions = params.providerOptions;
  if (!providerOptions || typeof providerOptions !== "object") return {};
  if (!("openai" in providerOptions)) return {};
  const openai = (providerOptions as { openai?: unknown }).openai;
  return openai && typeof openai === "object" ? { ...openai } : {};
}

function withOpenAI<T extends { providerOptions?: unknown }>(
  params: T,
  openai: Record<string, unknown>,
): T {
  return {
    ...params,
    providerOptions: {
      ...(typeof params.providerOptions === "object" && params.providerOptions
        ? params.providerOptions
        : {}),
      openai,
    },
  };
}

/** Cloud already has prior turns. Send only the new user message or tool results. */
function latestStep<T extends PromptMessage>(prompt: readonly T[]): T[] {
  const system = prompt.filter((message) => message.role === "system");
  const rest = prompt.filter((message) => message.role !== "system");
  if (rest.length === 0) return system;

  const last = rest[rest.length - 1]!;
  if (last.role === "tool") {
    let start = rest.length - 1;
    while (start > 0 && rest[start - 1]!.role === "tool") start -= 1;
    return [...system, ...rest.slice(start)];
  }

  const user = [...rest].reverse().find((message) => message.role === "user");
  return user ? [...system, user] : [...system, last];
}

/**
 * Read `conversationId` from Eve `clientContext`, strip that synthetic user
 * message, and set `store` + `conversation` on Responses stream calls.
 *
 * `@ai-sdk/openai` responses defaults `store` to true. Unset, that persists
 * item ids from the first turn; the next Eve prompt resends them and the
 * tool loop dies with "No tool call found for function call output".
 * `eve:dev` has no Cloud conversation id, so those calls must opt out.
 */
export function withCloudConversation(model: LanguageModel): LanguageModel {
  return wrapLanguageModel({
    model,
    middleware: {
      async transformParams({ params, type }) {
        const prompt = params.prompt as PromptMessage[];
        const conversationId = conversationIdFrom(prompt);
        const withoutCtx = prompt.filter((message) => !isClientContext(message));
        const openai = openaiOptions(params);
        delete openai.conversation;

        // Compaction (`generateText`) and eve:dev (no clientContext id) must
        // not persist Responses items. The Next Cloud UI sends conversationId.
        if (type !== "stream" || !conversationId) {
          return withOpenAI({ ...params, prompt: withoutCtx }, { ...openai, store: false });
        }

        return withOpenAI(
          { ...params, prompt: latestStep(withoutCtx) },
          { ...openai, store: true, conversation: conversationId },
        );
      },
    },
  });
}
