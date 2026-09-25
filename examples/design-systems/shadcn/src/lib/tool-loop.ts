import type OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

/**
 * Chat Completions function-tool loop. Cloud does not execute `function` tools
 * on this endpoint — we run them here and continue until the model answers.
 *
 * Tool-call rounds stay on the server. Only the final assistant text is streamed
 * so the client never stores `tool_calls` without matching `role: "tool"` messages.
 */
export type FunctionToolExecutor = (argsJson: string) => Promise<string>;

type AccumulatedToolCall = { id: string; name: string; arguments: string };

export function sanitizeChatMessages(
  messages: ChatCompletionMessageParam[],
): ChatCompletionMessageParam[] {
  return messages.flatMap((message) => {
    if (message.role === "tool") return [];
    if (message.role !== "assistant" || !("tool_calls" in message) || !message.tool_calls?.length) {
      return [message];
    }
    const { tool_calls: _toolCalls, ...rest } = message;
    const content = rest.content;
    const hasContent =
      typeof content === "string" ? content.length > 0 : Array.isArray(content) && content.length > 0;
    return hasContent ? [rest as ChatCompletionMessageParam] : [];
  });
}

export async function runChatToolLoop(options: {
  client: OpenAI;
  model: string;
  messages: ChatCompletionMessageParam[];
  tools: ChatCompletionTool[];
  executors: Record<string, FunctionToolExecutor>;
  enqueue: (chunk: unknown) => void;
  signal?: AbortSignal;
  maxRounds?: number;
}): Promise<void> {
  const { client, model, tools, executors, enqueue, signal, maxRounds = 5 } = options;
  const messages = sanitizeChatMessages(options.messages);

  for (let round = 0; round < maxRounds; round++) {
    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        tools,
        stream: true,
        ...(round === maxRounds - 1 ? { tool_choice: "none" as const } : {}),
      },
      { signal },
    );

    const toolCalls: AccumulatedToolCall[] = [];
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      for (const delta of choice?.delta?.tool_calls ?? []) {
        const index = delta.index ?? 0;
        const current = toolCalls[index] ?? { id: "", name: "", arguments: "" };
        if (delta.id) current.id = delta.id;
        if (delta.function?.name) current.name = delta.function.name;
        if (delta.function?.arguments) current.arguments += delta.function.arguments;
        toolCalls[index] = current;
      }
      // Forward text as it arrives. Skip tool_call deltas so the client never
      // stores assistant.tool_calls without matching role:"tool" messages.
      if (choice?.delta?.content || choice?.finish_reason === "stop") enqueue(chunk);
    }

    const calls = toolCalls.filter((call) => call?.id && call.name);
    const moreRounds = round < maxRounds - 1;
    if (calls.length > 0 && moreRounds) {
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: calls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: { name: call.name, arguments: call.arguments },
        })),
      });

      for (const call of calls) {
        const execute = executors[call.name];
        let output: string;
        try {
          output = execute
            ? await execute(call.arguments)
            : JSON.stringify({ error: `Unknown tool: ${call.name}` });
        } catch (err) {
          output = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: output });
      }
      continue;
    }

    if (finishReason !== "tool_calls") return;
  }
}
