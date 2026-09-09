import { wrapLanguageModel, type LanguageModel } from "ai";
import { defineState } from "eve/context";

/** Eve renders `clientContext` as this prefix plus a JSON object. */
const CLIENT_CONTEXT_PREFIX = "Client context:\n";

const cloudConversationId = defineState("openui.cloudConversationId", () => "");

type PromptMessage = {
  role: string;
  content: unknown;
};

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

function isClientContextMessage(message: PromptMessage): boolean {
  return message.role === "user" && userText(message).startsWith(CLIENT_CONTEXT_PREFIX);
}

function conversationIdFromPrompt(prompt: readonly PromptMessage[]): string {
  for (const message of prompt) {
    if (!isClientContextMessage(message)) continue;
    try {
      const parsed = JSON.parse(userText(message).slice(CLIENT_CONTEXT_PREFIX.length)) as {
        conversationId?: unknown;
      };
      if (typeof parsed.conversationId === "string" && parsed.conversationId) {
        return parsed.conversationId;
      }
    } catch {
      // ignore malformed client context
    }
  }
  return "";
}

function rememberConversationId(fromPrompt: string): string {
  try {
    if (fromPrompt) {
      cloudConversationId.update(() => fromPrompt);
      return fromPrompt;
    }
    return cloudConversationId.get();
  } catch {
    return fromPrompt;
  }
}

/** Cloud already holds prior turns. Send only the new user message or tool results. */
function cloudStepPrompt<T extends PromptMessage>(prompt: readonly T[]): T[] {
  const withoutCtx = prompt.filter((message) => !isClientContextMessage(message));
  const system = withoutCtx.filter((message) => message.role === "system");
  const rest = withoutCtx.filter((message) => message.role !== "system");
  if (rest.length === 0) return system;

  const last = rest[rest.length - 1]!;
  if (last.role === "tool") {
    let start = rest.length - 1;
    while (start > 0 && rest[start - 1]!.role === "tool") start -= 1;
    return [...system, ...rest.slice(start)];
  }

  for (let i = rest.length - 1; i >= 0; i -= 1) {
    if (rest[i]!.role === "user") return [...system, rest[i]!];
  }
  return [...system, last];
}

function openaiOptions(providerOptions: unknown): Record<string, unknown> {
  if (providerOptions && typeof providerOptions === "object" && "openai" in providerOptions) {
    const openai = (providerOptions as { openai?: unknown }).openai;
    if (openai && typeof openai === "object") return { ...openai };
  }
  return {};
}

/**
 * Attach OpenUI Cloud conversation persistence: read `conversationId` from Eve
 * `clientContext`, strip that synthetic user message, and set `store` +
 * `conversation` on Responses stream calls.
 */
export function withCloudConversation(model: LanguageModel): LanguageModel {
  return wrapLanguageModel({
    model,
    middleware: {
      async transformParams({ params, type }) {
        const prompt = params.prompt as PromptMessage[];
        const conversationId = rememberConversationId(conversationIdFromPrompt(prompt));
        const withoutCtx = prompt.filter((message) => !isClientContextMessage(message));

        // Compaction uses generateText. Don't write those calls into Cloud.
        if (type !== "stream" || !conversationId) {
          return { ...params, prompt: withoutCtx };
        }

        return {
          ...params,
          prompt: cloudStepPrompt(withoutCtx),
          providerOptions: {
            ...params.providerOptions,
            openai: {
              ...openaiOptions(params.providerOptions),
              store: true,
              conversation: conversationId,
            },
          },
        };
      },
    },
  });
}
