import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";

const analyticsSubagentSystemPrompt = readFileSync(
  join(process.cwd(), "src/generated/system-prompt.txt"),
  "utf-8",
);

function sanitizeOpenUiSpec(raw: string): string {
  let text = raw.trim();

  // Strip fenced code blocks if the model wraps output in markdown.
  text = text.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, "").replace(/\n?```$/, "").trim();

  // Strip full-document HTML wrappers while preserving inner OpenUI content.
  text = text
    .replace(/^<!doctype[^>]*>\s*/i, "")
    .replace(/^<html[^>]*>\s*/i, "")
    .replace(/\s*<\/html>\s*$/i, "")
    .replace(/^<body[^>]*>\s*/i, "")
    .replace(/\s*<\/body>\s*$/i, "")
    .trim();

  return text;
}

export const tools = {
  analytics_subagent: tool({
    description:
      "Delegate analytics tasks to a specialized sub-agent that returns an OpenUI response payload.",
    inputSchema: z.object({
      task: z
        .string()
        .describe("The analytics task to perform, including the question and expected output."),
      context: z
        .string()
        .optional()
        .describe("Optional additional context, such as prior conversation details."),
    }),
    execute: async ({ task, context }, { abortSignal }) => {
      const prompt = context
        ? `Analytics task:
${task}

Additional context:
${context}

Output contract (strict):
- Return only OpenUI language content.
- Do not include HTML wrappers like <html>, <body>, <div>, or markdown code fences.
- Do not include explanatory prose before or after the OpenUI output.`
        : `Analytics task:
${task}

Output contract (strict):
- Return only OpenUI language content.
- Do not include HTML wrappers like <html>, <body>, <div>, or markdown code fences.
- Do not include explanatory prose before or after the OpenUI output.`;

      console.info("[analytics_subagent] Input:\n", JSON.stringify({ task, context }, null, 2));
      console.info("[analytics_subagent] Prompt:\n", prompt);

      const result = await generateText({
        model: openai("gpt-5.4"),
        system: analyticsSubagentSystemPrompt,
        prompt,
        abortSignal,
      });

      const sanitizedOpenUiSpec = sanitizeOpenUiSpec(result.text);

      console.info("[analytics_subagent] Raw output:\n", result.text);
      console.info("[analytics_subagent] Sanitized output:\n", sanitizedOpenUiSpec);

      return {
        openuiSpec: sanitizedOpenUiSpec,
      };
    },
  }),

  get_weather: tool({
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
      const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear Skies"];
      const temp = knownTemps[location.toLowerCase()] ?? Math.floor(Math.random() * 30 + 5);
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      return {
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
      };
    },
  }),

  get_stock_price: tool({
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
  }),

  calculate: tool({
    description: "Evaluate a math expression.",
    inputSchema: z.object({
      expression: z.string().describe("Math expression to evaluate"),
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
  }),

  search_web: tool({
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
  }),
};
