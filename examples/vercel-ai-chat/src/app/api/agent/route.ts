import { streamText, tool, stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const maxDuration = 30;

const weatherTool = tool({
  description: "Get current weather for a location.",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  execute: async ({ location }) => {
    await new Promise((r) => setTimeout(r, 800));
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
    const conditions = [
      "Sunny",
      "Partly Cloudy",
      "Cloudy",
      "Light Rain",
      "Clear Skies",
    ];
    const temp =
      knownTemps[location.toLowerCase()] ?? Math.floor(Math.random() * 30 + 5);
    const condition =
      conditions[Math.floor(Math.random() * conditions.length)];
    return {
      location,
      temperature_celsius: temp,
      temperature_fahrenheit: Math.round(temp * 1.8 + 32),
      condition,
      humidity_percent: Math.floor(Math.random() * 40 + 40),
      wind_speed_kmh: Math.floor(Math.random() * 25 + 5),
      forecast: [
        {
          day: "Tomorrow",
          high: temp + 2,
          low: temp - 4,
          condition: "Partly Cloudy",
        },
        {
          day: "Day After",
          high: temp + 1,
          low: temp - 3,
          condition: "Sunny",
        },
      ],
    };
  },
});

const stockPriceTool = tool({
  description: "Get stock price for a ticker symbol.",
  inputSchema: z.object({
    symbol: z.string().describe("Ticker symbol, e.g. AAPL"),
  }),
  execute: async ({ symbol }) => {
    await new Promise((r) => setTimeout(r, 600));
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
    return {
      symbol: s,
      price: parseFloat((price + change).toFixed(2)),
      change,
      change_percent: parseFloat(((change / price) * 100).toFixed(2)),
      volume: `${(Math.random() * 50 + 10).toFixed(1)}M`,
      day_high: parseFloat((price + Math.abs(change) + 1.5).toFixed(2)),
      day_low: parseFloat((price - Math.abs(change) - 1.2).toFixed(2)),
    };
  },
});

const calculateTool = tool({
  description: "Evaluate a math expression.",
  inputSchema: z.object({
    expression: z.string().describe("Math expression"),
  }),
  execute: async ({ expression }) => {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const sanitized = expression.replace(
        /[^0-9+\-*/().%\s,Math.sqrtpowabsceilfloorround]/g,
        "",
      );
      const result = new Function(`return (${sanitized})`)();
      return { expression, result: Number(result) };
    } catch {
      return { expression, error: "Invalid expression" };
    }
  },
});

const searchWebTool = tool({
  description: "Search the web for information.",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }) => {
    await new Promise((r) => setTimeout(r, 1000));
    return {
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
    };
  },
});

export async function POST(req: Request) {
  const { messages, systemPrompt } = (await req.json()) as {
    messages: ModelMessage[];
    systemPrompt?: string;
  };

  const result = streamText({
    model: openai("gpt-5.2"),
    system: systemPrompt,
    messages,
    tools: {
      get_weather: weatherTool,
      get_stock_price: stockPriceTool,
      calculate: calculateTool,
      search_web: searchWebTool,
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
