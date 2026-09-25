import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import { tool } from "ai";
import { z } from "zod";

export const appTools = {
  get_weather: tool({
    description: getWeatherTool.description,
    inputSchema: z.object({
      location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
    }),
    execute: ({ location }, { abortSignal }) =>
      executeGetWeather(JSON.stringify({ location }), {
        signal: abortSignal,
      }),
  }),
} as const;

export const appToolNames = new Set(Object.keys(appTools));
