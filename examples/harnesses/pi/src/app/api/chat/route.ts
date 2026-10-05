import { abortSession, getOrCreateSession } from "@/lib/pi-session";
import type { NextRequest } from "next/server";

// The Pi SDK spawns bash, reads the filesystem, and talks to model providers —
// none of which works on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatBody {
  messages?: Array<{ role?: string; content?: unknown }>;
  threadId?: string;
}

/**
 * One newline-delimited OpenAI `chat.completion.chunk`. This is exactly what the
 * frontend's `openAIReadableStreamAdapter()` parses: NDJSON (one JSON object per
 * line, no `data:` prefix, no `[DONE]` sentinel).
 */
function ndjsonChunk(delta: Record<string, unknown>, finishReason: string | null = null): string {
  return `${JSON.stringify({
    id: "pi-chat",
    object: "chat.completion.chunk",
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  })}\n`;
}

// pi's reasoning and tool executions are surfaced as OpenAI `tool_calls`, which
// OpenUI renders as cards inside the collapsible "behind the scenes" section —
// the web equivalent of the Pi CLI's thinking/tool states. Both pieces of a
// tool_call (start = id+name, args = streamed arguments) reuse the same `index`.
function toolStartChunk(index: number, id: string, name: string, args = ""): string {
  return ndjsonChunk({
    tool_calls: [{ index, id, type: "function", function: { name, arguments: args } }],
  });
}
function toolArgsChunk(index: number, argsDelta: string): string {
  return ndjsonChunk({ tool_calls: [{ index, function: { arguments: argsDelta } }] });
}
function safeArgs(args: unknown): string {
  try {
    return JSON.stringify(args ?? {});
  } catch {
    return String(args);
  }
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }
  return "";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ChatBody;
  const conversationId = body.threadId?.trim() || crypto.randomUUID();
  const cwd = process.env.PI_AGENT_CWD || process.cwd();

  // The frontend re-sends the full thread, but Pi keeps its own transcript, so
  // we only feed it the newest user turn.
  const lastUser = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
  const userText = extractText(lastUser?.content);

  let session: Awaited<ReturnType<typeof getOrCreateSession>>["session"];
  let modelFallbackMessage: string | undefined;
  try {
    const entry = await getOrCreateSession(conversationId, { cwd });
    session = entry.session;
    modelFallbackMessage = entry.modelFallbackMessage;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (session.isStreaming) {
    // A previous turn on this conversation is still running (double-submit, or a
    // second tab on the same thread). Starting an overlapping turn would
    // interleave token streams and throw "already processing", so refuse politely.
    const busy =
      ndjsonChunk({ role: "assistant" }) +
      ndjsonChunk({
        content: "_Still responding to your previous message — please wait for it to finish._",
      }) +
      ndjsonChunk({}, "stop");
    return new Response(busy, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "x-conversation-id": conversationId,
      },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const enqueue = (line: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(line));
        } catch {
          closed = true; // client disconnected
        }
      };
      const finish = () => {
        if (closed) return;
        enqueue(ndjsonChunk({}, "stop"));
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Open the assistant message so the adapter starts a message immediately.
      enqueue(ndjsonChunk({ role: "assistant" }));
      if (modelFallbackMessage) {
        enqueue(ndjsonChunk({ content: `> ${modelFallbackMessage}\n\n` }));
      }

      // Assign each tool execution / thinking block a stable tool_calls index.
      let nextToolIndex = 0;
      const indexById = new Map<string, number>();
      const indexFor = (id: string): number => {
        let i = indexById.get(id);
        if (i === undefined) {
          i = nextToolIndex++;
          indexById.set(id, i);
        }
        return i;
      };
      let thinkingId: string | undefined;
      let thinkingSeq = 0;

      const unsubscribe = session.subscribe((event) => {
        if (event.type === "message_update") {
          const ame = event.assistantMessageEvent;
          if (ame.type === "text_delta" && ame.delta) {
            enqueue(ndjsonChunk({ content: ame.delta }));
          } else if (ame.type === "thinking_delta" && ame.delta) {
            // Stream the model's reasoning into a single "Thinking" card.
            if (!thinkingId) {
              thinkingId = `thinking-${thinkingSeq++}`;
              enqueue(toolStartChunk(indexFor(thinkingId), thinkingId, "Thinking"));
            }
            enqueue(toolArgsChunk(indexFor(thinkingId), ame.delta));
          } else if (ame.type === "thinking_end") {
            thinkingId = undefined;
          }
        } else if (event.type === "tool_execution_start") {
          // Show each tool run (read/bash/edit/write …) and its input.
          enqueue(
            toolStartChunk(
              indexFor(event.toolCallId),
              event.toolCallId,
              event.toolName,
              safeArgs(event.args),
            ),
          );
        }
      });

      const onAbort = () => abortSession(conversationId);
      req.signal.addEventListener("abort", onAbort);

      void (async () => {
        try {
          if (!userText) {
            enqueue(ndjsonChunk({ content: "_No user message was provided._" }));
            return;
          }
          await session.prompt(userText);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          enqueue(ndjsonChunk({ content: `\n\n**Pi error:** ${message}` }));
        } finally {
          unsubscribe();
          req.signal.removeEventListener("abort", onAbort);
          finish();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "x-conversation-id": conversationId,
    },
  });
}
