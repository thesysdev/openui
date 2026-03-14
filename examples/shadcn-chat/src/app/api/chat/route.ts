import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { join } from "path";

const systemPrompt = readFileSync(join(process.cwd(), "src/generated/system-prompt.txt"), "utf-8");

// ── Tool implementations ──

function getWeather({ location }: { location: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
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
      const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear Skies"];
      const temp = knownTemps[location.toLowerCase()] ?? Math.floor(Math.random() * 30 + 5);
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      resolve(
        JSON.stringify({
          location,
          temperature_celsius: temp,
          temperature_fahrenheit: Math.round(temp * 1.8 + 32),
          condition,
          humidity_percent: Math.floor(Math.random() * 40 + 40),
          wind_speed_kmh: Math.floor(Math.random() * 25 + 5),
          forecast: [
            { day: "Tomorrow", high: temp + 2, low: temp - 4, condition: "Partly Cloudy" },
            { day: "Day After", high: temp + 1, low: temp - 3, condition: "Sunny" },
          ],
        }),
      );
    }, 800);
  });
}

function getStockPrice({ symbol }: { symbol: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const s = symbol.toUpperCase();
      const knownPrices: Record<string, number> = {
        AAPL: 189.84,
        GOOGL: 141.8,
        TSLA: 248.42,
        MSFT: 378.91,
        AMZN: 178.25,
        NVDA: 875.28,
        META: 485.58,
      };
      const price = knownPrices[s] ?? Math.floor(Math.random() * 500 + 20);
      const change = parseFloat((Math.random() * 8 - 4).toFixed(2));
      resolve(
        JSON.stringify({
          symbol: s,
          price: parseFloat((price + change).toFixed(2)),
          change,
          change_percent: parseFloat(((change / price) * 100).toFixed(2)),
          volume: `${(Math.random() * 50 + 10).toFixed(1)}M`,
          day_high: parseFloat((price + Math.abs(change) + 1.5).toFixed(2)),
          day_low: parseFloat((price - Math.abs(change) - 1.2).toFixed(2)),
        }),
      );
    }, 600);
  });
}

function calculate({ expression }: { expression: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const sanitized = expression.replace(
          /[^0-9+\-*/().%\s,Math.sqrtpowabsceilfloorround]/g,
          "",
        );

        const result = new Function(`return (${sanitized})`)();
        resolve(JSON.stringify({ expression, result: Number(result) }));
      } catch {
        resolve(JSON.stringify({ expression, error: "Invalid expression" }));
      }
    }, 300);
  });
}

function searchWeb({ query }: { query: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        JSON.stringify({
          query,
          results: [
            {
              title: `Top result for "${query}"`,
              snippet: `Comprehensive overview of ${query} with the latest information.`,
            },
            {
              title: `${query} - Latest News`,
              snippet: `Recent developments and updates related to ${query}.`,
            },
            {
              title: `Understanding ${query}`,
              snippet: `An in-depth guide explaining everything about ${query}.`,
            },
          ],
        }),
      );
    }, 1000);
  });
}

// ── Tool definitions ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: any[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a location.",
      parameters: {
        type: "object",
        properties: { location: { type: "string", description: "City name" } },
        required: ["location"],
      },
      function: getWeather,
      parse: JSON.parse,
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description: "Get stock price for a ticker symbol.",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string", description: "Ticker symbol, e.g. AAPL" } },
        required: ["symbol"],
      },
      function: getStockPrice,
      parse: JSON.parse,
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Evaluate a math expression.",
      parameters: {
        type: "object",
        properties: { expression: { type: "string", description: "Math expression to evaluate" } },
        required: ["expression"],
      },
      function: calculate,
      parse: JSON.parse,
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
        required: ["query"],
      },
      function: searchWeb,
      parse: JSON.parse,
    },
  },
];

// ── SSE helpers ──

function sseToolCallStart(
  encoder: TextEncoder,
  tc: { id: string; function: { name: string } },
  index: number,
) {
  return encoder.encode(
    `data: ${JSON.stringify({
      id: `chatcmpl-tc-${tc.id}`,
      object: "chat.completion.chunk",
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index,
                id: tc.id,
                type: "function",
                function: { name: tc.function.name, arguments: "" },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    })}\n\n`,
  );
}

function sseToolCallArgs(
  encoder: TextEncoder,
  tc: { id: string; function: { arguments: string } },
  result: string,
  index: number,
) {
  let enrichedArgs: string;
  try {
    enrichedArgs = JSON.stringify({
      _request: JSON.parse(tc.function.arguments),
      _response: JSON.parse(result),
    });
  } catch {
    enrichedArgs = tc.function.arguments;
  }
  return encoder.encode(
    `data: ${JSON.stringify({
      id: `chatcmpl-tc-${tc.id}-args`,
      object: "chat.completion.chunk",
      choices: [
        {
          index: 0,
          delta: { tool_calls: [{ index, function: { arguments: enrichedArgs } }] },
          finish_reason: null,
        },
      ],
    })}\n\n`,
  );
}

// ── Route handler ──

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const MODEL = "gpt-4o";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanMessages = (messages as any[])
    .filter((m) => m.role !== "tool")
    .map((m) => {
      if (m.role === "assistant" && m.tool_calls?.length) {
        // Strip tool_calls (runTools re-runs the agentic loop server-side)
        // but preserve content so prior replies remain in context.
        const { tool_calls: _tc, ...rest } = m; // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest;
      }
      return m;
    });

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...cleanMessages,
  ];

  const encoder = new TextEncoder();
  let controllerClosed = false;

  const readable = new ReadableStream({
    start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try {
          controller.enqueue(data);
        } catch {
          /* already closed */
        }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const pendingCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let callIdx = 0;
      let resultIdx = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runner = (client.chat.completions as any).runTools({
        model: MODEL,
        messages: chatMessages,
        tools,
        stream: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runner.on("functionToolCall", (fc: any) => {
        const id = `tc-${callIdx}`;
        pendingCalls.push({ id, name: fc.name, arguments: fc.arguments });
        enqueue(sseToolCallStart(encoder, { id, function: { name: fc.name } }, callIdx));
        callIdx++;
      });

      runner.on("functionToolCallResult", (result: string) => {
        const tc = pendingCalls[resultIdx];
        if (tc) {
          enqueue(
            sseToolCallArgs(
              encoder,
              { id: tc.id, function: { arguments: tc.arguments } },
              result,
              resultIdx,
            ),
          );
        }
        resultIdx++;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runner.on("chunk", (chunk: any) => {
        const choice = chunk.choices?.[0];
        const delta = choice?.delta;
        if (!delta) return;
        if (delta.content) {
          enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (choice?.finish_reason === "stop") {
          enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      });

      runner.on("end", () => {
        enqueue(encoder.encode("data: [DONE]\n\n"));
        close();
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runner.on("error", (err: any) => {
        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg);
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        close();
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
}
