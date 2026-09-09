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
 */
export function withCloudConversation(model: LanguageModel): LanguageModel {
  return wrapLanguageModel({
    model,
    middleware: {
      async transformParams({ params, type }) {
        const prompt = params.prompt as PromptMessage[];
        const conversationId = conversationIdFrom(prompt);
        const withoutCtx = prompt.filter((message) => !isClientContext(message));

        // Compaction uses generateText. Don't write those calls into Cloud.
        if (type !== "stream" || !conversationId) {
          return { ...params, prompt: withoutCtx };
        }

        const openai =
          params.providerOptions &&
          typeof params.providerOptions === "object" &&
          "openai" in params.providerOptions &&
          params.providerOptions.openai &&
          typeof params.providerOptions.openai === "object"
            ? params.providerOptions.openai
            : {};

        return {
          ...params,
          prompt: latestStep(withoutCtx),
          providerOptions: {
            ...params.providerOptions,
            openai: { ...openai, store: true, conversation: conversationId },
          },
        };
      },
    },
  });
}
