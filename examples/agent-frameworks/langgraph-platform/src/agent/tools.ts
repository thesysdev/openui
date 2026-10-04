import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Mock domain tools shared by the specialist agents.
 *
 * They return canned-but-plausible JSON so the example runs without any
 * third-party API keys. Swap the bodies for real API calls when adapting
 * this example. The conversation starters in the UI map onto these tools.
 */

export const getWeather = tool(
  async ({ location }: { location: string }) => {
    const knownTemps: Record<string, number> = {
      tokyo: 22, "san francisco": 18, london: 14, "new york": 25,
      paris: 19, sydney: 27, mumbai: 33, berlin: 16,
    };
    const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear Skies"];
    const temp = knownTemps[location.toLowerCase()] ?? Math.floor(Math.random() * 30 + 5);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return JSON.stringify({
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
    });
  },
  {
    name: "get_weather",
    description: "Get current weather for a location.",
    schema: z.object({ location: z.string().describe("City name") }),
  },
);

export const getStockPrice = tool(
  async ({ symbol }: { symbol: string }) => {
    const s = symbol.toUpperCase();
    const knownPrices: Record<string, number> = {
      AAPL: 189.84, GOOGL: 141.8, TSLA: 248.42, MSFT: 378.91,
      AMZN: 178.25, NVDA: 875.28, META: 485.58,
    };
    const price = knownPrices[s] ?? Math.floor(Math.random() * 500 + 20);
    const change = parseFloat((Math.random() * 8 - 4).toFixed(2));

    return JSON.stringify({
      symbol: s,
      price: parseFloat((price + change).toFixed(2)),
      change,
      change_percent: parseFloat(((change / price) * 100).toFixed(2)),
      volume: `${(Math.random() * 50 + 10).toFixed(1)}M`,
      day_high: parseFloat((price + Math.abs(change) + 1.5).toFixed(2)),
      day_low: parseFloat((price - Math.abs(change) - 1.2).toFixed(2)),
    });
  },
  {
    name: "get_stock_price",
    description: "Get the stock price for a ticker symbol.",
    schema: z.object({ symbol: z.string().describe("Ticker symbol, e.g. AAPL") }),
  },
);

export const searchWeb = tool(
  async ({ query }: { query: string }) => {
    return JSON.stringify({
      query,
      results: [
        { title: `Top result for "${query}"`, snippet: `Comprehensive overview of ${query} with the latest information.` },
        { title: `${query} - Latest News`, snippet: `Recent developments and updates related to ${query}.` },
        { title: `Understanding ${query}`, snippet: `An in-depth guide explaining everything about ${query}.` },
      ],
    });
  },
  {
    name: "search_web",
    description: "Search the web for general information.",
    schema: z.object({ query: z.string().describe("Search query") }),
  },
);
