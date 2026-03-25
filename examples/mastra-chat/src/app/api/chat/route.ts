import { MastraAgent } from "@ag-ui/mastra";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { EventType, type Message, type TextInputContent } from "@openuidev/react-headless";
import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import { join } from "path";
import { z } from "zod";

const systemPromptFile = readFileSync(
  join(process.cwd(), "src/generated/system-prompt.txt"),
  "utf-8",
);

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

type AgentRunInput = Parameters<MastraAgent["run"]>[0];
type AgentMessage = AgentRunInput["messages"][number];

const agentTools: AgentRunInput["tools"] = [
  {
    name: getWeather.id,
    description: getWeather.description,
    parameters: getWeather.inputSchema,
  },
  {
    name: getStockPrice.id,
    description: getStockPrice.description,
    parameters: getStockPrice.inputSchema,
  },
];

function getAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please provide it in your environment variables to run this example.",
    );
  }

  const baseAgent = new Agent({
    id: "openui-agent",
    name: "OpenUI Agent",
    instructions: `You are a helpful assistant. Use tools when relevant and help the user with their requests. Always format your responses cleanly.\n\n${systemPromptFile}`,
    model: {
      id: (process.env.OPENAI_MODEL as `${string}/${string}`) || "openai/gpt-4o",
      apiKey: apiKey,
      url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    },
    tools: { getWeather, getStockPrice },
  });

  return new MastraAgent({
    agent: baseAgent,
    resourceId: "chat-user",
  });
}

function toAgentMessage(message: Message): AgentMessage | null {
  switch (message.role) {
    case "developer":
    case "system":
      return {
        id: message.id,
        role: message.role,
        content: message.content,
      };
    case "user":
      return {
        id: message.id,
        role: "user",
        content:
          typeof message.content === "string"
            ? message.content
            : message.content.find(
                (content): content is TextInputContent => content.type === "text",
              )?.text || "",
      };
    case "assistant":
      return {
        id: message.id,
        role: "assistant",
        content: message.content,
        toolCalls: message.toolCalls,
      };
    case "tool":
      return {
        id: message.id,
        role: "tool",
        content: message.content,
        toolCallId: message.toolCallId,
        error: message.error,
      };
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: Message[]; threadId: string } = await req.json();

    const convertedMessages = messages
      .map(toAgentMessage)
      .filter((message): message is AgentMessage => message !== null);

    const agent = getAgent();
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      start(controller) {
        const subscription = agent
          .run({
            messages: convertedMessages,
            threadId,
            runId: crypto.randomUUID(),
            tools: agentTools,
            context: [],
          })
          .subscribe({
            next: (event) => {
              if (
                (event.type === EventType.TEXT_MESSAGE_CHUNK ||
                  event.type === EventType.TEXT_MESSAGE_CONTENT) &&
                event.delta
              ) {
                const translatedEvent = {
                  type: EventType.TEXT_MESSAGE_CONTENT,
                  messageId: event.messageId || "current-message",
                  delta: event.delta,
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(translatedEvent)}\n\n`));
              } else if (event.type === EventType.RUN_ERROR) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: EventType.RUN_ERROR,
                      message: event.message || "An error occurred during the agent run",
                    })}\n\n`,
                  ),
                );
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            },
            complete: () => {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
            error: (error: unknown) => {
              const message =
                error instanceof Error ? error.message : "Unknown Mastra stream error";
              console.error("Mastra stream error:", error);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
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
