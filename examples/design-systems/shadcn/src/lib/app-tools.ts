import type { FunctionToolExecutor } from "@/lib/tool-loop";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

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

function parseArgs<T>(argsJson: string): T {
  return JSON.parse(argsJson || "{}") as T;
}

export const appToolDeclarations: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a location.",
      parameters: {
        type: "object",
        properties: { location: { type: "string", description: "City name" } },
        required: ["location"],
        additionalProperties: false,
      },
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
        additionalProperties: false,
      },
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
        additionalProperties: false,
      },
    },
  },
];

export const appToolExecutors: Record<string, FunctionToolExecutor> = {
  get_weather: (argsJson) => getWeather(parseArgs(argsJson)),
  get_stock_price: (argsJson) => getStockPrice(parseArgs(argsJson)),
  search_web: (argsJson) => searchWeb(parseArgs(argsJson)),
};
