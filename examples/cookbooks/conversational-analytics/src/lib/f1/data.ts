import { openf1 } from "./openf1";
import { cacheFor, type Session } from "./resolve";

// Typed, whole-session reads shared by the tools. Tools always fetch a whole session per
// endpoint and filter locally, so every question about a session hits the same cached file.

export type Lap = {
  driver_number: number;
  lap_number: number;
  date_start: string | null;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  is_pit_out_lap: boolean;
};
export type SessionResult = {
  position: number | null;
  driver_number: number;
  number_of_laps: number | null;
  points?: number | null;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  duration: number | number[] | null;
  gap_to_leader: number | string | Array<number | string | null> | null;
};
export type Stint = {
  driver_number: number;
  stint_number: number;
  lap_start: number | null;
  lap_end: number | null;
  compound: string | null;
  tyre_age_at_start: number | null;
};
export type Pit = {
  driver_number: number;
  lap_number: number;
  date: string;
  pit_duration: number | null;
  lane_duration?: number | null;
  stop_duration?: number | null;
};
export type Interval = {
  driver_number: number;
  date: string;
  gap_to_leader: number | string | null;
  interval: number | string | null;
};
export type Position = { driver_number: number; date: string; position: number };
export type RaceControl = {
  date: string;
  lap_number: number | null;
  category: string;
  flag: string | null;
  scope: string | null;
  sector: number | null;
  driver_number: number | null;
  message: string;
  qualifying_phase?: number | null;
};
export type Weather = {
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  wind_direction: number;
  wind_speed: number;
};
export type TeamRadio = { date: string; driver_number: number; recording_url: string };
export type Overtake = {
  date: string;
  overtaking_driver_number: number;
  overtaken_driver_number: number;
  position: number;
};
export type ChampionshipDriver = {
  session_key: number;
  driver_number: number;
  position_start: number | null;
  position_current: number | null;
  points_start: number | null;
  points_current: number | null;
};
export type StartingGrid = { driver_number: number; position: number; lap_duration: number | null };
export type ChampionshipTeam = {
  session_key: number;
  team_name: string;
  position_start: number | null;
  position_current: number | null;
  points_start: number | null;
  points_current: number | null;
};

const read =
  <T>(endpoint: string) =>
  (s: Session, signal?: AbortSignal) =>
    openf1<T>(endpoint, { session_key: s.key }, cacheFor(s, signal));

export const getLaps = read<Lap>("laps");
export const getSessionResult = read<SessionResult>("session_result");
export const getStintRows = read<Stint>("stints");
export const getPits = read<Pit>("pit");
export const getIntervals = read<Interval>("intervals");
export const getPositionRows = read<Position>("position");
export const getRaceControlRows = read<RaceControl>("race_control");
export const getWeatherRows = read<Weather>("weather");
export const getTeamRadioRows = read<TeamRadio>("team_radio");
export const getOvertakes = read<Overtake>("overtakes");
export const getChampionshipDrivers = read<ChampionshipDriver>("championship_drivers");
export const getChampionshipTeams = read<ChampionshipTeam>("championship_teams");
/** Keyed by the qualifying (or sprint qualifying) session, and includes grid penalties. */
export const getStartingGrid = read<StartingGrid>("starting_grid");

/** Endpoints the snapshot stores for each kind of session. */
export const SNAPSHOT_ENDPOINTS: Record<string, string[]> = {
  Race: [
    "drivers", "session_result", "laps", "stints", "pit", "position", "intervals",
    "race_control", "weather", "team_radio", "overtakes", "championship_drivers", "championship_teams",
  ],
  Sprint: [
    "drivers", "session_result", "laps", "stints", "pit", "position", "intervals",
    "race_control", "weather", "team_radio", "overtakes",
  ],
  Qualifying: ["drivers", "session_result", "starting_grid", "laps", "stints", "race_control", "weather", "team_radio"],
  "Sprint Qualifying": ["drivers", "session_result", "starting_grid", "laps", "stints", "race_control", "weather", "team_radio"],
  Practice: ["drivers", "session_result", "laps", "stints", "weather"],
};

// ── Lap timeline helpers ─────────────────────────────────────────────────

/** Per driver: lap number → start time (ms). */
export function lapStarts(laps: Lap[]) {
  const map = new Map<number, Map<number, number>>();
  for (const lap of laps) {
    if (!lap.date_start) continue;
    let d = map.get(lap.driver_number);
    if (!d) map.set(lap.driver_number, (d = new Map()));
    d.set(lap.lap_number, Date.parse(lap.date_start));
  }
  return map;
}

/** When each driver finished each lap (ms): the next lap's start, or start + duration. */
export function lapEnds(laps: Lap[]) {
  const starts = lapStarts(laps);
  const ends = new Map<number, Map<number, number>>();
  for (const lap of laps) {
    const start = starts.get(lap.driver_number)?.get(lap.lap_number);
    const next = starts.get(lap.driver_number)?.get(lap.lap_number + 1);
    const end = next ?? (start !== undefined && lap.lap_duration ? start + lap.lap_duration * 1000 : undefined);
    if (end === undefined) continue;
    let d = ends.get(lap.driver_number);
    if (!d) ends.set(lap.driver_number, (d = new Map()));
    d.set(lap.lap_number, end);
  }
  return ends;
}

/** The race lap (the leader's) in progress at a time, for timestamped rows. */
export function lapClock(laps: Lap[]) {
  const first = new Map<number, number>();
  for (const lap of laps) {
    if (!lap.date_start) continue;
    const t = Date.parse(lap.date_start);
    const prev = first.get(lap.lap_number);
    if (prev === undefined || t < prev) first.set(lap.lap_number, t);
  }
  const starts = [...first.entries()].sort((a, b) => a[0] - b[0]);
  return (iso: string) => {
    const t = Date.parse(iso);
    let lap: number | null = null;
    for (const [n, start] of starts) if (start <= t) lap = n;
    return lap;
  };
}

/** Last sample at or before `t` in a time-sorted array (binary search). */
export function sampleAt<T extends { date: string }>(sorted: T[], times: number[], t: number): T | undefined {
  let lo = 0;
  let hi = sorted.length - 1;
  let best = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) {
      best = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return best >= 0 ? sorted[best] : undefined;
}

export function byDriver<T extends { driver_number: number; date: string }>(rows: T[]) {
  const map = new Map<number, { rows: T[]; times: number[] }>();
  for (const row of rows) {
    let d = map.get(row.driver_number);
    if (!d) map.set(row.driver_number, (d = { rows: [], times: [] }));
    d.rows.push(row);
  }
  for (const d of map.values()) {
    d.rows.sort((a, b) => a.date.localeCompare(b.date));
    d.times = d.rows.map((r) => Date.parse(r.date));
  }
  return map;
}

export const round3 = (x: number) => Math.round(x * 1000) / 1000;
export const round1 = (x: number) => Math.round(x * 10) / 10;

export function formatLap(seconds: number | null | undefined) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return m ? `${m}:${s.toFixed(3).padStart(6, "0")}` : s.toFixed(3);
}

/** A numeric gap, or null for "+1 LAP" style strings. */
export function numericGap(x: number | string | null | undefined) {
  return typeof x === "number" ? x : null;
}
