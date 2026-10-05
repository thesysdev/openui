import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getWeather = createTool({
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

export const getStockPrice = createTool({
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
