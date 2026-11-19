import { createOpenUiChatPromptLibrary } from "@lynx-js/genui/openui/chat/agent";
import { generateSystemPrompt } from "@openuidev/lang-core";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

/**
 * The Lynx client renders with `createOpenUiChatLibrary()`. Exporting that same
 * library here gives the Gateway the exact component contract to validate the
 * model's OpenUI Lang against while it streams.
 */
const SYSTEM_PROMPT = generateSystemPrompt({
  cloud: true,
  library: createOpenUiChatPromptLibrary().toSpec(),
});

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === "assistant" || message.role === "user") &&
    typeof message.content === "string" &&
    message.content.length > 0 &&
    message.content.length <= 100_000
  );
}

async function readMessages(request: Request): Promise<ChatMessage[]> {
  const payload: unknown = await request.json();
  const messages =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>).messages : null;

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
    throw new Error("messages must be a non-empty array containing at most 50 items");
  }

  if (!messages.every(isChatMessage)) {
    throw new Error("each message must contain a user or assistant role and non-empty content");
  }

  return messages;
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const apiKey = process.env.THESYS_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse(
      "THESYS_API_KEY is not configured. Copy backend/env.example to backend/.env.local.",
      503,
    );
  }

  let messages: ChatMessage[];
  try {
    messages = await readMessages(request);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Invalid request body", 400);
  }

  const gateway = new OpenAI({
    apiKey,
    baseURL: process.env.OPENUI_GATEWAY_URL?.trim() || "https://api.thesys.dev/v1/embed",
  });

  let completion;
  try {
    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    completion = await gateway.chat.completions.create(
      {
        model: process.env.OPENUI_MODEL?.trim() || "google/gemini-3.6-flash-free",
        messages: chatMessages,
        stream: true,
      },
      { signal: request.signal },
    );
  } catch (error) {
    console.error("Failed to start the OpenUI model stream", error);
    return errorResponse("The model request could not be started. Check the backend logs.", 502);
  }

  // Raw text/plain chunks rather than SSE: this maps directly to Lynx's
  // streaming body reader on the client.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("The OpenUI model stream failed", error);
          controller.error(error);
        }
      }
    },
    cancel() {
      completion.controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
