import { randomUUID } from "node:crypto";
import type OpenAI from "openai";
import type {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

/**
 * Function-tool loop for the OpenUI Gateway Chat Completions API.
 *
 * Chat Completions returns function calls to the application instead of running
 * them. Each round streams one completion. When the model requests tools, the
 * loop runs them, appends the assistant's tool-call message and one `tool`
 * message per call, and requests the next completion. It ends when the model
 * answers without requesting a tool. The last allowed round sets
 * `tool_choice: "none"` so the model must answer in text.
 *
 * The browser receives AG-UI events rather than raw completion chunks, because
 * Chat Completions has no chunk for a tool result. Agent Interface reads them
 * with `agUIAdapter()` and shows each call with its result.
 */

export type FunctionToolExecutor = (
  argsJson: string,
  ctx: { signal?: AbortSignal },
) => Promise<string>;

export interface RunChatToolLoopOptions {
  client: OpenAI;
  /** The completion request; `messages` holds the system prompt and the conversation. */
  params: Omit<ChatCompletionCreateParamsStreaming, "stream">;
  /** name → executor. A call to any other name receives an error result. */
  tools: Record<string, FunctionToolExecutor>;
  /** Receives every AG-UI event to forward to the browser. */
  emit: (event: Record<string, unknown>) => void;
  /** Propagates browser aborts into executors and model requests. */
  signal?: AbortSignal;
  /** Cap on model requests per question (default 5). */
  maxRounds?: number;
}

type ToolCall = { id: string; name: string; arguments: string };

export async function runChatToolLoop(options: RunChatToolLoopOptions): Promise<void> {
  const { client, tools, emit, signal, maxRounds = 5 } = options;
  const messages: ChatCompletionMessageParam[] = [...options.params.messages];

  for (let round = 0; round < maxRounds; round++) {
    const lastRound = round === maxRounds - 1;
    const stream = await client.chat.completions.create(
      {
        ...options.params,
        messages,
        stream: true,
        ...(lastRound ? { tool_choice: "none" as const } : {}),
      },
      { signal },
    );

    const messageId = randomUUID();
    let text = "";
    const calls: ToolCall[] = [];
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        if (!text) emit({ type: "TEXT_MESSAGE_START", messageId, role: "assistant" });
        text += delta.content;
        emit({ type: "TEXT_MESSAGE_CONTENT", messageId, delta: delta.content });
      }
      // Each call streams as indexed deltas: its id and name first, then argument fragments.
      // The last round ignores calls, in case a model does not honor tool_choice.
      for (const part of lastRound ? [] : (delta?.tool_calls ?? [])) {
        let call = calls[part.index];
        if (!call) {
          call = { id: part.id ?? "", name: part.function?.name ?? "", arguments: "" };
          calls[part.index] = call;
          emit({
            type: "TOOL_CALL_START",
            toolCallId: call.id,
            toolCallName: call.name,
            parentMessageId: messageId,
          });
        }
        if (part.function?.arguments) {
          call.arguments += part.function.arguments;
          emit({ type: "TOOL_CALL_ARGS", toolCallId: call.id, delta: part.function.arguments });
        }
      }
    }
    if (text) emit({ type: "TEXT_MESSAGE_END", messageId });

    const requested = calls.filter(Boolean);
    if (requested.length === 0) {
      if (!text) throw new Error("The model returned no answer. Please retry.");
      return;
    }

    messages.push({
      role: "assistant",
      content: text || null,
      tool_calls: requested.map((call) => ({
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: call.arguments },
      })),
    });
    for (const call of requested) emit({ type: "TOOL_CALL_END", toolCallId: call.id });
    // A throwing executor settles as an error result rather than aborting the run.
    for (const call of requested) {
      let content: string;
      try {
        const execute = Object.hasOwn(tools, call.name) ? tools[call.name] : undefined;
        if (!execute) throw new Error(`Unknown tool: ${call.name}`);
        content = await execute(call.arguments, { signal });
      } catch (error) {
        content = JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      }
      messages.push({ role: "tool", tool_call_id: call.id, content });
      emit({
        type: "TOOL_CALL_RESULT",
        messageId: randomUUID(),
        toolCallId: call.id,
        content,
        role: "tool",
      });
    }
  }
}
