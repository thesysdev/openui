import { z } from "zod/v4";
import { getLaps, getTeamRadioRows, getWeatherRows, lapClock, round1 } from "../data";
import { driverMap, resolveDrivers, sessionDrivers } from "../resolve";
import { defineF1Tool, joinNotes, openSession, sessionArg } from "./define";

export const getWeather = defineF1Tool({
  name: "get_weather",
  description:
    "Weather through a session, about once a minute from OpenF1, reduced to at most 40 rows: air and track temperature (°C), humidity, pressure, wind, and whether it rained, with the race lap for each row. Includes min/max summary.",
  input: z.object({
    session: sessionArg("session"),
    rows: z.number().int().min(5).max(120).default(40).describe("Maximum rows."),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ time: "11:05", lap: 3, air: 26.1, track: 38.4, humidity: 41, windSpeed: 1.2, windDirection: 55, rain: false }],
    summary: { airMin: 25.8, airMax: 26.6, trackMin: 37.9, trackMax: 40.1, rained: false },
  },
  async run({ session: ref, rows: max }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    const [weather, laps] = await Promise.all([getWeatherRows(session, signal), getLaps(session, signal)]);
    if (!weather.length) return { session: label, rows: [], note: joinNotes(note, "No weather data for this session.") };
    const sorted = [...weather].sort((a, b) => a.date.localeCompare(b.date));
    const lapAt = lapClock(laps);
    const every = Math.max(1, Math.ceil(sorted.length / max));
    const rows = sorted
      .filter((_, i) => i % every === 0 || i === sorted.length - 1)
      .map((w) => ({
        time: w.date.slice(11, 16),
        lap: lapAt(w.date),
        air: w.air_temperature,
        track: w.track_temperature,
        humidity: w.humidity,
        pressure: w.pressure,
        windSpeed: w.wind_speed,
        windDirection: w.wind_direction,
        rain: w.rainfall > 0,
      }));
    const air = sorted.map((w) => w.air_temperature);
    const track = sorted.map((w) => w.track_temperature);
    const rainy = sorted.filter((w) => w.rainfall > 0);
    return {
      session: label,
      rows,
      summary: {
        airMin: Math.min(...air),
        airMax: Math.max(...air),
        trackMin: Math.min(...track),
        trackMax: Math.max(...track),
        avgHumidity: round1(sorted.reduce((s, w) => s + w.humidity, 0) / sorted.length),
        rained: rainy.length > 0,
        rainFrom: rainy[0]?.date.slice(11, 16) ?? null,
      },
      note: joinNotes(note, "Times are UTC."),
    };
  },
});

export const getTeamRadio = defineF1Tool({
  name: "get_team_radio",
  description:
    "Team radio clips published for a session: UTC time, race lap, driver and a link to the MP3 recording. OpenF1 has no transcripts, so the content of a message is unknown unless someone listens to it.",
  input: z.object({
    session: sessionArg("session"),
    driver: z.string().max(30).optional().describe("Only this driver's clips."),
    limit: z.number().int().min(1).max(100).default(30),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ time: "12:45:31", lap: 48, code: "RUS", name: "George Russell", teamColour: "#00D7B6", url: "https://livetiming.formula1.com/static/.../RUS_63.mp3" }],
  },
  async run({ session: ref, driver, limit }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    const [radio, drivers, laps] = await Promise.all([
      getTeamRadioRows(session, signal),
      sessionDrivers(session, signal),
      getLaps(session, signal),
    ]);
    const who = driverMap(drivers);
    const target = driver ? resolveDrivers([driver], drivers)[0] : null;
    const lapAt = lapClock(laps);
    const matching = radio
      .filter((r) => !target || r.driver_number === target.number)
      .sort((a, b) => a.date.localeCompare(b.date));
    const rows = matching.slice(-limit).map((r) => {
      const d = who.get(r.driver_number);
      return {
        time: r.date.slice(11, 19),
        lap: lapAt(r.date),
        code: d?.code ?? String(r.driver_number),
        name: d?.name ?? null,
        teamColour: d?.teamColour ?? null,
        url: r.recording_url,
      };
    });
    return {
      session: label,
      rows,
      note: joinNotes(note, matching.length > limit && `Showing the last ${limit} of ${matching.length} clips.`, "Audio only; no transcripts."),
    };
  },
});
