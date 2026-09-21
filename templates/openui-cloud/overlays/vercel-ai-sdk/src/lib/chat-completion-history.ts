import { storeChatCompletionHistory } from "@openuidev/server/openai";

type CompletionMessage = Parameters<typeof storeChatCompletionHistory>[0]["messages"][number];
export type CompletionUserMessage = Extract<CompletionMessage, { role: "user" }>;
export type PersistStep = {
  text?: string;
  toolCalls?: { toolCallId: string; toolName: string; input: unknown }[];
  toolResults?: { toolCallId: string; output: unknown }[];
};

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
