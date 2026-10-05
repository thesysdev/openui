// Eve's runtime module-map loads this file as native ESM, so relative
// imports need an explicit .ts extension (extensionless only works under
// Eve's compile-time rolldown bundler).
import { getWeather, WEATHER_TOOL_DESCRIPTION } from "../../src/lib/tools/get-weather.ts";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: WEATHER_TOOL_DESCRIPTION,
  inputSchema: z.object({
    location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
  }),
  outputSchema: z.union([
    z.object({
      place: z.string(),
      temperature_c: z.number(),
      conditions: z.string(),
      wind_kmh: z.number(),
    }),
    z.object({ error: z.string() }),
  ]),
  execute: ({ location }) => getWeather(location),
});
