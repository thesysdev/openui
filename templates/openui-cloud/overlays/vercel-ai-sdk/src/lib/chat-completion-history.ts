import { storeChatCompletionHistory } from "@openuidev/server";

type CompletionMessage = Parameters<typeof storeChatCompletionHistory>[0]["messages"][number];
export type CompletionUserMessage = Extract<CompletionMessage, { role: "user" }>;
export type PersistStep = {
  text?: string;
  toolCalls?: { toolCallId: string; toolName: string; input: unknown }[];
  toolResults?: { toolCallId: string; output: unknown }[];
};

export class ConversationAccessError extends Error {
  constructor(public readonly status: number) {
    super("Unable to access Cloud conversation");
  }
}

/** Check the same server-controlled demo scope used by /api/frontend-token. */
export async function assertConversationAccess(conversationId: unknown): Promise<string> {
  if (typeof conversationId !== "string" || !/^conv_[\w-]{1,200}$/.test(conversationId)) {
    throw new ConversationAccessError(400);
  }
  const response = await fetch(
    `https://api.thesys.dev/v1/conversations/${encodeURIComponent(conversationId)}`,
    {
      headers: { Authorization: `Bearer ${process.env.THESYS_API_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new ConversationAccessError(
      response.status === 404 || response.status === 403 ? 404 : 503,
    );
  }
  const conversation = await response.json();
  // Replace DEMO_USER_ID with authenticated session identity in both routes
  // when adding multi-user authentication to this template.
  if (
    conversation.user_id !== (process.env.DEMO_USER_ID || "demo-user") ||
    (conversation.app_id ?? "") !== (process.env.APP_ID || "")
  ) {
    throw new ConversationAccessError(404);
  }
  return conversationId;
}

function toolOutput(value: unknown): string {
  return typeof value === "string" ? value : (JSON.stringify(value) ?? "null");
}

/** Append only this turn: replayed history would create duplicate items. */
export async function storeChatCompletionTurn(options: {
  conversationId: string;
  user: CompletionUserMessage;
  steps: PersistStep[];
}): Promise<void> {
  const messages: CompletionMessage[] = [options.user];
  for (const step of options.steps) {
    if (step.text || step.toolCalls?.length) {
      messages.push({
        role: "assistant",
        content: step.text || null,
        ...(step.toolCalls?.length
          ? {
              tool_calls: step.toolCalls.map((call) => ({
                id: call.toolCallId,
                type: "function" as const,
                function: {
                  name: call.toolName,
                  arguments: JSON.stringify(call.input) ?? "{}",
                },
              })),
            }
          : {}),
      });
    }
    for (const result of step.toolResults ?? []) {
      messages.push({
        role: "tool",
        tool_call_id: result.toolCallId,
        content: toolOutput(result.output),
      });
    }
  }
  if (!process.env.THESYS_API_KEY) throw new Error("Missing THESYS_API_KEY");
  await storeChatCompletionHistory({
    apiKey: process.env.THESYS_API_KEY,
    conversationId: options.conversationId,
    messages,
    fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(30_000) }),
  });
}
