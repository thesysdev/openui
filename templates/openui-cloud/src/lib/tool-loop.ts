import type OpenAI from "openai";
import type {
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall,
} from "openai/resources/chat/completions";

export type FunctionToolExecutor = (
  argsJson: string,
  ctx: { callId: string; signal?: AbortSignal },
) => Promise<string>;

interface RunFunctionToolLoopOptions {
  client: OpenAI;
  createParams: ChatCompletionCreateParamsNonStreaming;
  firstStream: AsyncIterable<ChatCompletionChunk>;
  tools: Record<string, FunctionToolExecutor>;
  enqueue: (chunk: ChatCompletionChunk) => void;
  signal?: AbortSignal;
  maxRounds?: number;
}

/** Replay history between tool rounds; return only new messages for Cloud storage. */
export async function runFunctionToolLoop({
  client,
  createParams,
  firstStream,
  tools,
  enqueue,
  signal,
  maxRounds = 5,
}: RunFunctionToolLoopOptions): Promise<ChatCompletionMessageParam[]> {
  const turn: ChatCompletionMessageParam[] = [];
  let stream = firstStream;

  for (let round = 0; ; round++) {
    const calls = new Map<number, ChatCompletionMessageFunctionToolCall>();
    let content = "";

    for await (const chunk of stream) {
      signal?.throwIfAborted();
      enqueue(chunk);
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        content += delta.content;
      }
      for (const part of delta?.tool_calls ?? []) {
        let call = calls.get(part.index);
        if (!call) {
          call = {
            id: "",
            type: "function",
            function: { name: "", arguments: "" },
          };
          calls.set(part.index, call);
        }
        if (part.id) call.id = part.id;
        if (part.function?.name) call.function.name += part.function.name;
        if (part.function?.arguments)
          call.function.arguments += part.function.arguments;
      }
    }

    const toolCalls = [...calls.values()];
    for (const call of toolCalls) {
      if (!call.id || !call.function.name)
        throw new Error("Incomplete tool call from upstream");
    }
    turn.push({
      role: "assistant",
      content: content || null,
      ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
    });
    if (toolCalls.length === 0) return turn;
    if (round >= maxRounds)
      throw new Error("Model exceeded the tool-call round limit");

    for (const call of toolCalls) {
      signal?.throwIfAborted();
      let output: string;
      try {
        if (!Object.hasOwn(tools, call.function.name)) {
          throw new Error(`Unknown tool: ${call.function.name}`);
        }
        output = await tools[call.function.name]!(call.function.arguments, {
          callId: call.id,
          signal,
        });
      } catch (error) {
        signal?.throwIfAborted();
        output = JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        });
      }
      turn.push({ role: "tool", tool_call_id: call.id, content: output });
    }

    stream = await client.chat.completions.create(
      {
        ...createParams,
        messages: [...createParams.messages, ...turn],
        stream: true,
        ...(round >= maxRounds - 1 ? { tool_choice: "none" as const } : {}),
      },
      { signal },
    );
  }
}
