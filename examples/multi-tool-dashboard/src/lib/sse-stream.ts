import type { ChatCompletionStreamingRunner } from "openai/lib/ChatCompletionStreamingRunner";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function toolCallStartChunk(id: string, name: string, index: number) {
  return {
    id: `chatcmpl-tc-${id}`,
    object: "chat.completion.chunk",
    choices: [
      {
        index: 0,
        delta: {
          tool_calls: [{ index, id, type: "function", function: { name, arguments: "" } }],
        },
        finish_reason: null,
      },
    ],
  };
}

function toolCallArgsChunk(id: string, rawArgs: string, result: string, index: number) {
  let enrichedArgs: string;
  try {
    enrichedArgs = JSON.stringify({
      _request: JSON.parse(rawArgs),
      _response: JSON.parse(result),
    });
  } catch {
    enrichedArgs = rawArgs;
  }
  return {
    id: `chatcmpl-tc-${id}-args`,
    object: "chat.completion.chunk",
    choices: [
      {
        index: 0,
        delta: { tool_calls: [{ index, function: { arguments: enrichedArgs } }] },
        finish_reason: null,
      },
    ],
  };
}

/**
 * Wraps a ChatCompletionStreamingRunner in an SSE Response that
 * streams tool-call events and content chunks to the client.
 */
export function sseResponseFromRunner(
  runner: ChatCompletionStreamingRunner<unknown>,
): Response {
  const encoder = new TextEncoder();
  let closed = false;

  const readable = new ReadableStream({
    start(controller) {
      const send = (text: string) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(text)); } catch { /* closed */ }
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch { /* closed */ }
      };

      const pendingCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let callIdx = 0;
      let resultIdx = 0;

      runner.on("functionToolCall", (fc) => {
        const id = `tc-${callIdx}`;
        pendingCalls.push({ id, name: fc.name, arguments: fc.arguments });
        send(sseEvent(toolCallStartChunk(id, fc.name, callIdx)));
        callIdx++;
      });

      runner.on("functionToolCallResult", (result) => {
        const tc = pendingCalls[resultIdx];
        if (tc) {
          send(sseEvent(toolCallArgsChunk(tc.id, tc.arguments, result, resultIdx)));
        }
        resultIdx++;
      });

      runner.on("chunk", (chunk) => {
        const choice = chunk.choices?.[0];
        if (!choice?.delta) return;
        if (choice.delta.content || choice.finish_reason === "stop") {
          send(sseEvent(chunk));
        }
      });

      runner.on("end", () => {
        send("data: [DONE]\n\n");
        finish();
      });

      runner.on("error", (err) => {
        console.error("[chat] Error:", err);
        send(sseEvent({ error: err.message }));
        finish();
      });
    },
  });

  return new Response(readable, { headers: SSE_HEADERS });
}
