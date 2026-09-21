import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { storeChatCompletionHistory } from "../openai/store-conversation-items";
import type { StoreChatCompletionHistoryOptions } from "../openai/types";

export type StoreHistoryTransport = Omit<StoreChatCompletionHistoryOptions, "messages">;

export type HistoryStep = {
  text?: string;
  toolCalls?: { toolCallId: string; toolName: string; input: unknown }[];
  toolResults?: { toolCallId: string; output: unknown }[];
};

function toolOutput(value: unknown): string {
  return typeof value === "string" ? value : (JSON.stringify(value) ?? "null");
}

export function historyStepsToMessages(
  user: Extract<ChatCompletionMessageParam, { role: "user" }>,
  steps: HistoryStep[],
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [user];
  for (const step of steps) {
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
  return messages;
}

export function storeHistoryTurn(
  options: StoreHistoryTransport & {
    user: Extract<ChatCompletionMessageParam, { role: "user" }>;
    steps: HistoryStep[];
  },
) {
  return storeChatCompletionHistory({
    apiKey: options.apiKey,
    conversationId: options.conversationId,
    apiBaseUrl: options.apiBaseUrl,
    fetch: options.fetch,
    messages: historyStepsToMessages(options.user, options.steps),
  });
}
