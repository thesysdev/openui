import { defineTool } from "eve/tools";
import { z } from "zod";

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

export default defineTool({
  description:
    "Get the current weather for a city or place name. Use whenever the user " +
    "asks about weather, temperature, rain, or what to wear.",
  inputSchema: z.object({
    location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
  }),
  outputSchema: z.string(),
  async execute({ location }) {
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.searchParams.set("name", location);
    geoUrl.searchParams.set("count", "1");
    const geo = (await (await fetch(geoUrl)).json()) as {
      results?: Array<{ name: string; country?: string; latitude: number; longitude: number }>;
    };
    const place = geo.results?.[0];
    if (!place) return JSON.stringify({ error: `No place found for "${location}"` });

    const wxUrl = new URL("https://api.open-meteo.com/v1/forecast");
    wxUrl.searchParams.set("latitude", String(place.latitude));
    wxUrl.searchParams.set("longitude", String(place.longitude));
    wxUrl.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
    const wx = (await (await fetch(wxUrl)).json()) as {
      current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
    };
    if (!wx.current) return JSON.stringify({ error: "No weather data returned" });

    return JSON.stringify({
      place: `${place.name}${place.country ? `, ${place.country}` : ""}`,
      temperature_c: wx.current.temperature_2m,
      conditions: describeWeather(wx.current.weather_code),
      wind_kmh: wx.current.wind_speed_10m,
    });
  },
});
