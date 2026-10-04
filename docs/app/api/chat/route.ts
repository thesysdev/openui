import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { openuiChatPromptOptions } from "@openuidev/react-ui/genui-lib/prompt-options";
import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { join } from "path";

const librarySpec = JSON.parse(
  readFileSync(join(process.cwd(), "generated/chat-library.spec.json"), "utf-8"),
) as LibrarySpec;

const openUiSystemPrompt = generateSystemPrompt({
  library: librarySpec,
  promptOptions: openuiChatPromptOptions,
});

const markdownSystemPrompt = `You are a helpful assistant. Respond using clear, well-structured GitHub-Flavored Markdown.

Use headings, lists, tables, links, block quotes, and fenced code blocks when they make the response easier to understand.

Return only Markdown content. Do not emit OpenUI Lang, component syntax, JSON UI descriptions, or instructions for a renderer.`;

type ResponseMode = "markdown" | "openui";
const TOOL_NAMES = ["get_weather", "get_stock_price", "search_web"] as const;
type ToolName = (typeof TOOL_NAMES)[number];
const TOOL_NAME_SET = new Set<string>(TOOL_NAMES);

interface ChatRequestBody {
  messages: unknown[];
  responseMode?: ResponseMode;
  toolNames?: ToolName[];
}

function invalidRequest(message: string) {
  return Response.json({ error: { message } }, { status: 400 });
}

function parseRequestBody(body: unknown): ChatRequestBody | Response {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidRequest("Request body must be a JSON object");
  }

  const { messages, responseMode, toolNames } = body as Record<string, unknown>;

  if (!Array.isArray(messages)) {
    return invalidRequest("messages must be an array");
  }

  if (responseMode !== undefined && responseMode !== "markdown" && responseMode !== "openui") {
    return invalidRequest('responseMode must be either "markdown" or "openui"');
  }

  if (
    toolNames !== undefined &&
    (!Array.isArray(toolNames) ||
      !toolNames.every((toolName) => typeof toolName === "string" && TOOL_NAME_SET.has(toolName)))
  ) {
    return invalidRequest(`toolNames must contain only: ${TOOL_NAMES.join(", ")}`);
  }

  return {
    messages,
    responseMode: responseMode as ResponseMode | undefined,
    toolNames: toolNames as ToolName[] | undefined,
  };
}

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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return invalidRequest("Request body must be valid JSON");
  }

  const parsedBody = parseRequestBody(body);
  if (parsedBody instanceof Response) {
    return parsedBody;
  }

  const { messages, responseMode = "openui", toolNames } = parsedBody;
  const selectedTools =
    toolNames === undefined
      ? tools
      : tools.filter((tool) => toolNames.includes(tool.function.name as ToolName));

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { message: "OPENROUTER_API_KEY not configured" } },
      { status: 500 },
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const MODEL = "google/gemini-3.6-flash";

  const cleanMessages = (messages as any[])
    .filter(
      (m) =>
        m.role !== "tool" &&
        (responseMode === "openui" || (m.role !== "system" && m.role !== "developer")),
    )
    .map((m) => {
      if (m.role === "assistant" && m.tool_calls?.length) {
        const { tool_calls: _tc, ...rest } = m;
        return rest;
      }
      return m;
    });

  const chatMessages: ChatCompletionMessageParam[] = [
    {
      role: "system" as const,
      content: responseMode === "markdown" ? markdownSystemPrompt : openUiSystemPrompt,
    },
    ...cleanMessages,
  ];

  const encoder = new TextEncoder();
  let controllerClosed = false;
  let activeRunner: { abort: () => void } | undefined;

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

      const runner: any =
        selectedTools.length === 0
          ? client.chat.completions.stream(
              {
                model: MODEL,
                messages: chatMessages,
              },
              { signal: req.signal },
            )
          : (client.chat.completions as any).runTools(
              {
                model: MODEL,
                messages: chatMessages,
                tools: selectedTools,
                stream: true,
              },
              { signal: req.signal },
            );
      activeRunner = runner;

      const handleAbort = () => {
        runner.abort();
        close();
      };
      req.signal.addEventListener("abort", handleAbort, { once: true });

      const finish = () => {
        req.signal.removeEventListener("abort", handleAbort);
        activeRunner = undefined;
        close();
      };

      if (selectedTools.length > 0) {
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
      }

      runner.on("chunk", (chunk: any) => {
        // Keep credit handling to non-2xx responses. Provider-specific mid-stream
        // chunks are intentionally ignored because they are harder to maintain
        // across OpenRouter/OpenAI streaming shape changes.
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
        if (controllerClosed) return;

        enqueue(encoder.encode("data: [DONE]\n\n"));
        finish();
      });

      runner.on("error", (err: any) => {
        if (controllerClosed) return;

        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg);
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        finish();
      });

      runner.on("abort", finish);
    },
    cancel() {
      activeRunner?.abort();
      activeRunner = undefined;
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
