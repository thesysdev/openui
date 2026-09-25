import { createAgent } from "@/agent";
import { adkToAguiEvents } from "@/lib/adk-to-agui";
import { InMemorySessionService, Runner, StreamingMode } from "@google/adk";
import { EventType } from "@openuidev/react-headless";
import { NextRequest } from "next/server";

// @google/adk relies on Node APIs, so pin this route to the Node.js runtime.
export const runtime = "nodejs";

const APP_NAME = "openui-adk-chat";
const USER_ID = "demo-user";

// A single Runner + in-memory session store, shared across requests. Sessions
// are keyed by the chat threadId so multi-turn history is preserved for the
// lifetime of the server process.
const sessionService = new InMemorySessionService();
const sessions = new Map<string, string>();
let runner: Runner | undefined;

function getRunner(): Runner {
  runner ??= new Runner({
    appName: APP_NAME,
    agent: createAgent(),
    sessionService,
  });
  return runner;
}

interface ChatMessage {
  role: string;
  content?: string | Array<{ type?: string; text?: string }>;
}

function messageText(message: ChatMessage | undefined): string {
  if (!message?.content) return "";
  if (typeof message.content === "string") return message.content;
  return message.content
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("");
}

async function ensureSession(threadId: string): Promise<string> {
  const existing = sessions.get(threadId);
  if (existing) return existing;
  const session = await sessionService.createSession({ appName: APP_NAME, userId: USER_ID });
  sessions.set(threadId, session.id);
  return session.id;
}

function sse(event: object): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: ChatMessage[]; threadId: string } = await req.json();

    const lastUser = [...(messages ?? [])].reverse().find((m) => m.role === "user");
    const prompt = messageText(lastUser);
    if (!prompt) {
      return new Response(JSON.stringify({ error: "No user message provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resolvedThreadId = threadId || "default";
    const sessionId = await ensureSession(resolvedThreadId);
    const encoder = new TextEncoder();
    const runId = crypto.randomUUID();

    const readable = new ReadableStream({
      async start(controller) {
        let closed = false;
        const enqueue = (event: object) => {
          if (closed) return;
          controller.enqueue(encoder.encode(sse(event)));
        };
        const close = () => {
          if (closed) return;
          closed = true;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        };

        try {
          for await (const event of adkToAguiEvents(
            getRunner().runAsync({
              userId: USER_ID,
              sessionId,
              newMessage: { parts: [{ text: prompt }] },
              runConfig: { streamingMode: StreamingMode.SSE },
              abortSignal: req.signal,
            }),
            { threadId: resolvedThreadId, runId },
          )) {
            enqueue(event);
          }
        } catch (error) {
          if (!req.signal.aborted) {
            const message = error instanceof Error ? error.message : "ADK stream error";
            console.error("ADK stream error:", error);
            enqueue({ type: EventType.RUN_ERROR, message });
          }
        } finally {
          close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown route error";
    console.error("Route error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
