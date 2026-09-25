/**
 * Example function tool: current weather via Open-Meteo (free, no API key).
 *
 * This is the reference for adding your own tools — declare the tool to the
 * model (`getWeatherTool`) and execute it on your server (`executeGetWeather`),
 * wired together through `runFunctionToolLoop` in the chat route.
 */

/** OpenAI Responses `type: "function"` declaration sent to the model. */
export const getWeatherTool = {
  type: "function" as const,
  name: "get_weather",
  description:
    "Get the current weather for a city or place name. Use whenever the user " +
    "asks about weather, temperature, rain, or what to wear.",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City or place name, e.g. 'Berlin' or 'San Francisco'.",
      },
    },
    required: ["location"],
    additionalProperties: false,
  },
  strict: false,
};

// WMO weather codes (https://open-meteo.com/en/docs), collapsed to families.
function describeWeather(code: number): string {
  if (code === 0) return "clear sky";
  if (code <= 3) return "partly cloudy";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain showers";
  if (code <= 86) return "snow showers";
  return "thunderstorm";
}

export async function executeGetWeather(
  argsJson: string,
  ctx: { signal?: AbortSignal } = {},
): Promise<string> {
  let location: string;
  try {
    const args = JSON.parse(argsJson || "{}") as { location?: unknown };
    if (typeof args.location !== "string" || !args.location.trim()) {
      return JSON.stringify({ error: "location is required" });
    }
    location = args.location.trim();
  } catch {
    return JSON.stringify({ error: "invalid JSON arguments" });
  }

  try {
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.searchParams.set("name", location);
    geoUrl.searchParams.set("count", "1");
    const geo = (await (await fetch(geoUrl, { signal: ctx.signal })).json()) as {
      results?: Array<{ name: string; country?: string; latitude: number; longitude: number }>;
    };
    const place = geo.results?.[0];
    if (!place) return JSON.stringify({ error: `No place found for "${location}"` });

    const wxUrl = new URL("https://api.open-meteo.com/v1/forecast");
    wxUrl.searchParams.set("latitude", String(place.latitude));
    wxUrl.searchParams.set("longitude", String(place.longitude));
    wxUrl.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
    const wx = (await (await fetch(wxUrl, { signal: ctx.signal })).json()) as {
      current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
    };
    if (!wx.current) return JSON.stringify({ error: "No weather data returned" });

    return JSON.stringify({
      place: `${place.name}${place.country ? `, ${place.country}` : ""}`,
      temperature_c: wx.current.temperature_2m,
      conditions: describeWeather(wx.current.weather_code),
      wind_kmh: wx.current.wind_speed_10m,
    });
  } catch (err) {
    return JSON.stringify({
      error: `Weather lookup failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
