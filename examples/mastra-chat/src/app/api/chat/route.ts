import { MastraAgent } from "@ag-ui/mastra";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import type { Message } from "@ag-ui/core";
import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import { join } from "path";
import { z } from "zod";

const systemPromptFile = readFileSync(
  join(process.cwd(), "src/generated/system-prompt.txt"),
  "utf-8",
);

// ========== Mock tools ==========
const getWeather = createTool({
  id: "get_weather",
  description: "Get current weather for a city.",
  inputSchema: z.object({ location: z.string().describe("City name") }),
  execute: async ({ location }) => {
    const knownTemps: Record<string, number> = {
      tokyo: 22,
      "san francisco": 18,
      london: 14,
      "new york": 25,
      paris: 19,
      sydney: 27,
      mumbai: 33,
      berlin: 16,
    };
    const temp = knownTemps[location.toLowerCase()] ?? Math.floor(Math.random() * 30 + 5);
    return { location, temperature_celsius: temp, condition: "Clear" };
  },
});

const getStockPrice = createTool({
  id: "get_stock_price",
  description: "Get current stock price for a ticker symbol.",
  inputSchema: z.object({ symbol: z.string().describe("Ticker symbol, e.g. AAPL") }),
  execute: async ({ symbol }) => {
    const prices: Record<string, number> = {
      AAPL: 189.84,
      GOOGL: 141.8,
      TSLA: 248.42,
      MSFT: 378.91,
      NVDA: 875.28,
    };
    const s = symbol.toUpperCase();
    const price = prices[s] ?? Math.floor(Math.random() * 500 + 50);
    return { symbol: s, price };
  },
});
// ================================

function createAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please provide it in your environment variables to run this example.",
    );
  }

  return new MastraAgent({
    agent: new Agent({
      id: "openui-agent",
      name: "OpenUI Agent",
      instructions: `You are a helpful assistant. Use tools when relevant and help the user with their requests. Always format your responses cleanly.\n\n${systemPromptFile}`,
      model: {
        id: (process.env.OPENAI_MODEL as `${string}/${string}`) || "openai/gpt-4o",
        apiKey,
        url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      },
      tools: { getWeather, getStockPrice },
    }),
    resourceId: "chat-user",
  });
}

const agent = createAgent();

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: Message[]; threadId: string } = await req.json();
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        };

        const subscription = agent
          .run({
            messages,
            threadId,
            runId: crypto.randomUUID(),
            tools: [],
            context: [],
          })
          .subscribe({
            next: (event) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            },
            complete: close,
            error: (error: Error) => {
              const msg = error.message;
              console.error("Mastra stream error:", error);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
              close();
            },
          });

        req.signal.addEventListener("abort", () => {
          subscription.unsubscribe();
        });
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
