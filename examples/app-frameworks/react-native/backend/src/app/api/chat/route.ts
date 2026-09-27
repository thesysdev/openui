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

export async function POST(req: NextRequest) {
  try {
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

    const completion = await openai.chat.completions.create({
      model: "google/gemini-3.6-flash-free",
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });

    // Stream raw text chunks — simpler for React Native to consume than SSE
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (error) {
          controller.error(error);
          return;
        }
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
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Model request failed" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }
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
