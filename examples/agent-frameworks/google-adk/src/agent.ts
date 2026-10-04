import { cloudInstructions } from "@/lib/cloud-prompt";
import { Agent, FunctionTool } from "@google/adk";
import { Custom } from "adk-llm-bridge";
import { z } from "zod";

/**
 * A tiny custom tool. The LLM decides when to call it based on the
 * `description` and `parameters` schema below.
 */
export const getWeather = new FunctionTool({
  name: "get_weather",
  description: "Get the current weather for a given city.",
  parameters: z.object({
    city: z.string().describe('The city to get the weather for, e.g. "Tokyo".'),
  }),
  execute: ({ city }) => {
    // Hard-coded so the demo runs without any external weather API.
    const table: Record<string, { condition: string; temperature_celsius: number }> = {
      tokyo: { condition: "Sunny", temperature_celsius: 24 },
      london: { condition: "Rainy", temperature_celsius: 14 },
      "san francisco": { condition: "Foggy", temperature_celsius: 17 },
      "new york": { condition: "Cloudy", temperature_celsius: 21 },
      paris: { condition: "Clear", temperature_celsius: 19 },
      sydney: { condition: "Sunny", temperature_celsius: 27 },
    };
    const key = city.toLowerCase();
    const data = table[key];
    if (!data) {
      return { city, error: "No weather data for this city." };
    }
    return { city, ...data };
  },
});

/**
 * ADK still owns tools, sessions, and the Runner. Custom() speaks Chat
 * Completions (POST /v1/embed/chat/completions) via the embed base URL.
 */
export function createAgent() {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Missing required env var: THESYS_API_KEY");

  return new Agent({
    name: "openui-adk-agent",
    model: Custom("google/gemini-3.6-flash-free", {
      name: "openui-adk-agent",
      baseURL: "https://api.thesys.dev/v1/embed",
      apiKey,
    }),
    instruction: cloudInstructions(),
    tools: [getWeather],
  });
}
