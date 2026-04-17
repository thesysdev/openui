import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

/**
 * POST /api/chat
 *
 * Accepts an OpenAI-format message array and an optional threadId.
 * Streams the assistant reply as Server-Sent Events (openai-completions format).
 * After the stream finishes, persists the full conversation to Supabase so
 * that loadThread can restore it when the user reopens the thread.
 */
export async function POST(req: NextRequest) {
  const { messages, threadId } = (await req.json()) as {
    messages: ChatCompletionMessageParam[];
    threadId?: string | null;
  };

  // Create the Supabase client before streaming so the request context
  // (cookies) is still available when we persist messages afterwards.
  const supabase = await createSupabaseServer();

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
  });

  let assistantContent = "";
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (data: Uint8Array) => {
        try {
          controller.enqueue(data);
        } catch {
          // Controller already closed (client disconnected)
        }
      };

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          assistantContent += delta.content;
        }
        enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }

      enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();

      // ── Persist the full conversation ──────────────────────────────────────
      // We replace all messages for this thread on every turn so that the
      // stored history always reflects the current state.  This is simple and
      // correct; for large threads you may prefer an append-only strategy.
      if (threadId) {
        try {
          const allMessages: ChatCompletionMessageParam[] = [
            ...messages,
            { role: "assistant", content: assistantContent },
          ];

          await supabase.from("messages").delete().eq("thread_id", threadId);

          await supabase.from("messages").insert(
            allMessages.map((m) => ({
              thread_id: threadId,
              role: m.role,
              content:
                typeof m.content === "string" ? m.content : JSON.stringify(m.content),
            })),
          );
        } catch (err) {
          console.error("[chat] Failed to persist messages:", err);
        }
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
}
