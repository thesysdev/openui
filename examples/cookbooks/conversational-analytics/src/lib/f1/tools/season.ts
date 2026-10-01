import { z } from "zod/v4";
import {
  getChampionshipDrivers,
  getChampionshipTeams,
  getSessionResult,
  type ChampionshipDriver,
  type ChampionshipTeam,
} from "../data";
import {
  allSessions,
  CURRENT_YEAR,
  season,
  sessionDrivers,
  resolveDrivers,
  type Driver,
  type Session,
} from "../resolve";
import { defineF1Tool, driverList, joinNotes, openSession, sessionArg } from "./define";

const yearArg = z.number().int().min(2023).max(CURRENT_YEAR).default(CURRENT_YEAR).describe("Season.");

export const getSchedule = defineF1Tool({
  name: "get_schedule",
  description:
    "The season calendar: one row per Grand Prix with round, name, place, dates and status (completed, upcoming, next, cancelled). Use for 'when is the next race', 'how many races are left', or a calendar view.",
  input: z.object({
    year: yearArg,
    filter: z.enum(["all", "completed", "upcoming", "next"]).default("all"),
    include_sessions: z.boolean().default(false).describe("Add each weekend's sessions with UTC start times."),
  }),
  output: {
    session: "2026 season",
    rows: [{ round: 18, name: "Azerbaijan Grand Prix", location: "Baku", country: "Azerbaijan", countryCode: "AZE", circuit: "Baku", start: "2026-09-24", end: "2026-09-26", status: "completed", sprint: false }],
    next: { round: 19, name: "Malaysia Grand Prix", raceStart: "2026-10-04T07:00:00Z" },
  },
  async run({ year, filter, include_sessions }, { signal }) {
    const meetings = await season(year, signal);
    const now = Date.now();
    const races = meetings.filter((m) => !m.testing);
    const race = (m: (typeof races)[number]) => m.sessions.find((s) => s.name === "Race");
    const next = races.find((m) => !m.cancelled && (race(m) ? Date.parse(race(m)!.dateEnd) > now : false));
    const rows = races
      .map((m) => {
        const r = race(m);
        const status = m.cancelled
          ? "cancelled"
          : r && r.finished
            ? "completed"
            : m === next
              ? Date.parse(m.dateStart) < now ? "in progress" : "next"
              : "upcoming";
        return {
          round: m.round,
          name: m.name,
          location: m.location,
          country: m.country,
          countryCode: m.countryCode,
          circuit: m.circuit,
          start: m.dateStart.slice(0, 10),
          end: m.dateEnd.slice(0, 10),
          raceStart: r?.dateStart ?? null,
          status,
          sprint: m.sessions.some((s) => s.name === "Sprint"),
          ...(include_sessions
            ? { sessions: m.sessions.map((s) => ({ name: s.name, start: s.dateStart, finished: s.finished })) }
            : {}),
        };
      })
      .filter((row) =>
        filter === "all"
          ? true
          : filter === "completed"
            ? row.status === "completed"
            : filter === "next"
              ? row.status === "next" || row.status === "in progress"
              : row.status !== "completed" && row.status !== "cancelled",
      );
    const completed = races.filter((m) => race(m)?.finished && !m.cancelled).length;
    const scheduled = races.filter((m) => !m.cancelled).length;
    return {
      session: `${year} season`,
      rows,
      next: next ? { round: next.round, name: next.name, raceStart: race(next)?.dateStart ?? null } : null,
      summary: `${completed} of ${scheduled} Grands Prix completed${races.some((m) => m.cancelled) ? `; ${races.filter((m) => m.cancelled).length} cancelled` : ""}.`,
    };
  },
});

export const getDrivers = defineF1Tool({
  name: "get_drivers",
  description: "The entry list for a session: number, three-letter code, name, team and team colour.",
  input: z.object({ session: sessionArg() }),
  output: { session: "2026 Azerbaijan Grand Prix · Race", rows: [{ number: 16, code: "LEC", name: "Charles Leclerc", team: "Ferrari", teamColour: "#ED1131" }] },
  async run({ session: ref }, { signal }) {
    const { session, label, note } = await openSession(ref, signal);
    const drivers = await sessionDrivers(session, signal);
    return {
      session: label,
      note,
      rows: drivers.map(({ number, code, name, team, teamColour }) => ({ number, code, name, team, teamColour })),
    };
  },
});

// ── Standings ────────────────────────────────────────────────────────────

type Standing = { key: string; points: number; position: number; pointsBefore: number | null; positionBefore: number | null };

/** Standings after a race session: OpenF1's championship endpoints, else summed results. */
async function standingsAfter(race: Session, kind: "drivers" | "teams", signal?: AbortSignal) {
  const drivers = await sessionDrivers(race, signal);
  if (kind === "drivers") {
    const rows: ChampionshipDriver[] = await getChampionshipDrivers(race, signal);
    if (rows.length)
      return {
        drivers,
        computed: false,
        rows: rows.map((r) => ({
          key: String(r.driver_number),
          points: r.points_current ?? 0,
          position: r.position_current ?? 0,
          pointsBefore: r.points_start,
          positionBefore: r.position_start,
        })),
      };
  } else {
    const rows: ChampionshipTeam[] = await getChampionshipTeams(race, signal);
    if (rows.length)
      return {
        drivers,
        computed: false,
        rows: rows.map((r) => ({
          key: r.team_name,
          points: r.points_current ?? 0,
          position: r.position_current ?? 0,
          pointsBefore: r.points_start,
          positionBefore: r.position_start,
        })),
      };
  }
  // Fallback: sum points from every race and sprint result up to this race.
  const scored = (await allSessions(race.year, signal)).filter(
    (s) => (s.name === "Race" || s.name === "Sprint") && s.finished && !s.cancelled && s.dateStart <= race.dateStart,
  );
  const totals = new Map<string, number>();
  const before = new Map<string, number>();
  for (const s of scored) {
    const [results, entrants] = await Promise.all([getSessionResult(s, signal), sessionDrivers(s, signal)]);
    const team = new Map(entrants.map((d) => [d.number, d.team]));
    for (const r of results) {
      const key = kind === "drivers" ? String(r.driver_number) : (team.get(r.driver_number) ?? "?");
      totals.set(key, (totals.get(key) ?? 0) + (r.points ?? 0));
      if (s.meetingKey !== race.meetingKey) before.set(key, (before.get(key) ?? 0) + (r.points ?? 0));
    }
  }
  const rank = (m: Map<string, number>) =>
    new Map([...m.entries()].sort((a, b) => b[1] - a[1]).map(([k], i) => [k, i + 1]));
  const pos = rank(totals);
  const posBefore = rank(before);
  return {
    drivers,
    computed: true,
    rows: [...totals.entries()].map(([key, points]) => ({
      key,
      points,
      position: pos.get(key)!,
      pointsBefore: before.get(key) ?? 0,
      positionBefore: posBefore.get(key) ?? null,
    })),
  };
}

/** Entrants by number, adding drivers who raced earlier in the season but not in `race`. */
async function withPastDrivers(race: Session, drivers: Driver[], numbers: string[], signal?: AbortSignal) {
  const map = new Map(drivers.map((d) => [String(d.number), d]));
  const missing = new Set(numbers.filter((n) => !map.has(n)));
  if (!missing.size) return map;
  const earlier = (await allSessions(race.year, signal))
    .filter((s) => s.name === "Race" && s.finished && !s.cancelled && s.dateStart < race.dateStart)
    .reverse();
  for (const s of earlier) {
    for (const d of await sessionDrivers(s, signal))
      if (missing.delete(String(d.number))) map.set(String(d.number), d);
    if (!missing.size) break;
  }
  return map;
}

function teamColours(drivers: Driver[]) {
  return new Map(drivers.map((d) => [d.team, d.teamColour]));
}

export const getStandings = defineF1Tool({
  name: "get_standings",
  description:
    "Drivers' or constructors' championship standings after a race (default: after the latest race), with points gained and places changed at that race. view 'progression' returns cumulative points after every round for chosen drivers or teams, ready for a line chart.",
  input: z.object({
    kind: z.enum(["drivers", "teams"]).default("drivers"),
    after: sessionArg("race the standings are taken after"),
    view: z.enum(["table", "progression"]).default("table"),
    drivers: driverList(8).optional().describe("For progression: driver codes, or team names when kind is teams. Omit for the top N."),
    top: z.number().int().min(1).max(22).optional().describe("Limit rows (table) or series (progression, default 5)."),
  }),
  output: {
    session: "2026 standings after Azerbaijan Grand Prix (round 18)",
    rows: [{ position: 1, code: "ANT", name: "Andrea Kimi Antonelli", team: "Mercedes", teamColour: "#00D7B6", points: 302, gained: 10, positionChange: 0 }],
    chart: { labels: ["AUS", "CHN"], series: [{ name: "ANT", values: [18, 43] }] },
  },
  async run({ kind, after, view, drivers: wanted, top }, { signal }) {
    const { session: race, note } = await openSession(after, signal, "Race");
    if (race.name !== "Race") throw new RangeError("Standings are taken after a race; name a race, not another session.");
    const title = `${race.year} ${kind === "drivers" ? "drivers'" : "constructors'"} standings after the ${race.meetingName} (round ${race.round})`;

    if (view === "table") {
      const { drivers, rows, computed } = await standingsAfter(race, kind, signal);
      const byNumber = await withPastDrivers(race, drivers, kind === "drivers" ? rows.map((r) => r.key) : [], signal);
      const colours = teamColours(drivers);
      const out = rows
        .sort((a, b) => a.position - b.position)
        .slice(0, top ?? rows.length)
        .map((r: Standing) => {
          const d = byNumber.get(r.key);
          const common = {
            points: r.points,
            gained: r.pointsBefore == null ? null : r.points - r.pointsBefore,
            positionChange: r.positionBefore == null ? null : r.positionBefore - r.position,
          };
          return kind === "drivers"
            ? { position: r.position, code: d?.code ?? r.key, name: d?.name ?? `#${r.key}`, team: d?.team ?? null, teamColour: d?.teamColour ?? null, ...common }
            : { position: r.position, team: r.key, teamColour: colours.get(r.key) ?? null, ...common };
        });
      const leader = out[0];
      const second = out[1];
      return {
        session: title,
        rows: out,
        summary:
          leader && second
            ? `${"code" in leader ? leader.name : leader.team} leads by ${leader.points - second.points} points.`
            : undefined,
        note: joinNotes(note, computed && "Computed by summing race and sprint results; OpenF1's championship endpoint had no data for this race."),
      };
    }

    // Progression: standings after every completed race up to `race`.
    const races = (await allSessions(race.year, signal)).filter(
      (s) => s.name === "Race" && s.finished && !s.cancelled && s.dateStart <= race.dateStart,
    );
    const snapshots: Array<{ race: Session } & Awaited<ReturnType<typeof standingsAfter>>> = [];
    for (const r of races) snapshots.push({ race: r, ...(await standingsAfter(r, kind, signal)) });
    const last = snapshots.at(-1)!;
    let keys: string[];
    if (wanted?.length) {
      keys =
        kind === "drivers"
          ? resolveDrivers(wanted, last.drivers).map((d) => String(d.number))
          : wanted.map((w) => {
              const hit = last.rows.find((r) => r.key.toLowerCase().includes(String(w).toLowerCase()));
              if (!hit) throw new RangeError(`Unknown team "${w}". Teams: ${last.rows.map((r) => r.key).join(", ")}.`);
              return hit.key;
            });
    } else keys = [...last.rows].sort((a, b) => a.position - b.position).slice(0, top ?? 5).map((r) => r.key);
    const allDrivers = new Map<string, Driver>();
    for (const s of snapshots) for (const d of s.drivers) allDrivers.set(String(d.number), d);
    const label = (key: string) => (kind === "drivers" ? (allDrivers.get(key)?.code ?? key) : key);
    const labels = snapshots.map((s) => s.race.circuit);
    const series = keys.map((key) => ({
      name: label(key),
      values: snapshots.map((s) => s.rows.find((r) => r.key === key)?.points ?? 0),
    }));
    return {
      session: `${race.year} ${kind === "drivers" ? "drivers'" : "constructors'"} championship progression to round ${race.round}`,
      rows: snapshots.map((s, i) => ({
        round: s.race.round,
        race: s.race.meetingName,
        circuit: s.race.circuit,
        ...Object.fromEntries(series.map((x) => [x.name, x.values[i]])),
      })),
      chart: { labels, series, xLabel: "Round", yLabel: "Points" },
      note: joinNotes(note, snapshots.some((s) => s.computed) && "Some rounds were computed from race and sprint results."),
    };
  },
});
