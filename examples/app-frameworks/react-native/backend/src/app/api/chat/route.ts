import { library, promptOptions } from "@/library";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = generateSystemPrompt({
  cloud: true,
  library: library.toSpec(),
  promptOptions: {
    examples: promptOptions.examples,
    preamble: promptOptions.preamble,
    additionalRules: promptOptions.additionalRules,
  },
});
console.info("[OpenUI Lang] System prompt loaded:\n", SYSTEM_PROMPT);

const conversationLog: Array<{ role: string; content: string }> = [];

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractText(msg: any): string {
  const content = msg?.content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.parts)
        return parsed.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
    } catch {
      /* plain string */
    }
    return content;
  }
  if (Array.isArray(content))
    return content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  if (Array.isArray(msg?.parts))
    return msg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  if (typeof msg?.text === "string") return msg.text;
  return JSON.stringify(msg);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "THESYS_API_KEY is not configured" }, { status: 500 });
  }

  // Chat Completions → POST /v1/embed/chat/completions (plain-text deltas for RN)
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.thesys.dev/v1/embed",
  });
  const { messages } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastUserMsg = (messages as any[]).filter((m: any) => m.role === "user").pop();
  if (lastUserMsg) conversationLog.push({ role: "user", content: extractText(lastUserMsg) });

  const completion = await openai.chat.completions.create({
    model: "google/gemini-3.6-flash-free",
    stream: true,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });

  // Stream raw text chunks — simpler for React Native to consume than SSE
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      for await (const chunk of completion) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          fullResponse += text;
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      conversationLog.push({ role: "assistant", content: fullResponse });
      console.info(
        "[OpenUI Lang] Conversation:\n",
        JSON.stringify(
          conversationLog.map((m) => ({ ...m, content: m.content.replace(/\n/g, " ") })),
          null,
          2,
        ),
      );
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Allow cross-origin requests from the Expo dev server / ngrok tunnel
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
