import { z } from "zod/v4";
import {
  byDriver,
  formatLap,
  getIntervals,
  getLaps,
  getOvertakes,
  getPits,
  getPositionRows,
  getRaceControlRows,
  getSessionResult,
  getStartingGrid,
  getStintRows,
  lapEnds,
  numericGap,
  round3,
  sampleAt,
  type Lap,
  type Pit,
  type Stint,
} from "../data";
import { allSessions, driverMap, resolveDrivers, sessionDrivers, type Driver, type Session } from "../resolve";
import { lapChart } from "./chart";
import { defineF1Tool, driverList, joinNotes, openSession, sessionArg } from "./define";

// Race-analysis tools. Each reads whole-session data (cached) and reduces it to one row per lap
// or per driver, so components get rows they can draw directly.

const lapRange = {
  lap_start: z.number().int().min(1).max(90).optional().describe("First lap, inclusive (default 1)."),
  lap_end: z.number().int().min(1).max(90).optional().describe("Last lap, inclusive (default the final lap)."),
};

function range(laps: Lap[], start?: number, end?: number) {
  const last = Math.max(0, ...laps.map((l) => l.lap_number));
  const from = Math.max(1, start ?? 1);
  const to = Math.min(last, end ?? last);
  if (from > to) throw new RangeError(`Choose laps between 1 and ${last}.`);
  return { from, to, last, list: Array.from({ length: to - from + 1 }, (_, i) => from + i) };
}

/** Laps each driver pitted on (in-laps), from the pit endpoint. */
function inLaps(pits: Pit[]) {
  const set = new Set<string>();
  for (const p of pits) set.add(`${p.driver_number}:${p.lap_number}`);
  return set;
}

/** Representative laps: timed, not lap 1, not in/out laps, within 107% of the driver's median. */
function cleanLaps(laps: Lap[], pits: Pit[]) {
  const pitIn = inLaps(pits);
  const candidate = laps.filter(
    (l) => l.lap_duration && l.lap_number > 1 && !l.is_pit_out_lap && !pitIn.has(`${l.driver_number}:${l.lap_number}`),
  );
  const medians = new Map<number, number>();
  for (const [n, list] of groupBy(candidate, (l) => l.driver_number)) medians.set(n, median(list.map((l) => l.lap_duration!)));
  return candidate.filter((l) => l.lap_duration! <= medians.get(l.driver_number)! * 1.07);
}

function groupBy<T, K>(rows: T[], key: (row: T) => K) {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}
function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function requireRaceLike(session: Session, what: string) {
  if (session.name !== "Race" && session.name !== "Sprint")
    throw new RangeError(`${what} is only recorded for races and sprints; ${session.name} was requested.`);
}

async function finishOrder(session: Session, signal?: AbortSignal) {
  const results = await getSessionResult(session, signal);
  return [...results].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).map((r) => r.driver_number);
}

async function pickDrivers(
  session: Session,
  drivers: Driver[],
  refs: Array<string | number> | undefined,
  fallbackTop: number,
  signal?: AbortSignal,
) {
  if (refs?.length) return resolveDrivers(refs, drivers);
  const order = await finishOrder(session, signal);
  const who = driverMap(drivers);
  const picked = order.map((n) => who.get(n)).filter((d): d is Driver => !!d);
  return (picked.length ? picked : drivers).slice(0, fallbackTop);
}

// ── get_lap_times ────────────────────────────────────────────────────────

export const getLapTimes = defineF1Tool({
  name: "get_lap_times",
  description:
    "Lap times for any session. view 'laps': one row per lap for one to four drivers (seconds) with a chart and, for two or more, each driver's lap-time difference to the first. 'fastest': best lap per driver ranked, with sectors and speed trap. 'pace': race pace per driver from representative laps (median, mean, spread), excluding lap 1, pit laps and slow laps such as safety cars. 'sectors': best sector times and theoretical best lap per driver.",
  input: z.object({
    session: sessionArg("session"),
    view: z.enum(["laps", "fastest", "pace", "sectors"]).default("laps"),
    drivers: driverList(4).optional().describe('For "laps", one to four drivers (default the top two finishers). For other views, omit for everyone.'),
    ...lapRange,
    top: z.number().int().min(1).max(22).optional().describe("Rows in a ranking (default all)."),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ lap: 10, LEC: 108.411, RUS: 108.2 }],
    chart: { labels: ["10"], series: [{ name: "LEC", values: [108.411] }], xLabel: "Lap", yLabel: "Lap time (s)" },
    deltas: { reference: "LEC", meaning: "Positive: LEC was faster on that lap.", chart: { labels: ["10"], series: [{ name: "RUS − LEC", values: [-0.211] }] } },
  },
  async run({ session: ref, view, drivers: refs, lap_start, lap_end, top }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    const [laps, drivers, pits] = await Promise.all([
      getLaps(session, signal),
      sessionDrivers(session, signal),
      session.name === "Race" || session.name === "Sprint" ? getPits(session, signal) : Promise.resolve([] as Pit[]),
    ]);
    if (!laps.length) return { session: label, rows: [], note: joinNotes(note, "No lap data for this session.") };
    const who = driverMap(drivers);
    const r = range(laps, lap_start, lap_end);
    const inRange = laps.filter((l) => l.lap_number >= r.from && l.lap_number <= r.to);
    const scope = `laps ${r.from}–${r.to}`;

    if (view === "laps") {
      const selected = await pickDrivers(session, drivers, refs, 2, signal);
      const pitIn = inLaps(pits);
      const time = new Map(inRange.map((l) => [`${l.driver_number}:${l.lap_number}`, l]));
      const rows = r.list.map((lap) => {
        const row: Record<string, unknown> = { lap };
        for (const d of selected) {
          const l = time.get(`${d.number}:${lap}`);
          row[d.code] = l?.lap_duration ?? null;
          if (l?.is_pit_out_lap) row[`${d.code}_note`] = "pit out";
          else if (pitIn.has(`${d.number}:${lap}`)) row[`${d.code}_note`] = "pit in";
        }
        return row;
      });
      const labels = r.list.map(String);
      const chart = lapChart(
        labels,
        selected.map((d) => ({ name: d.code, values: rows.map((row) => row[d.code] as number | null) })),
        { xLabel: "Lap", yLabel: "Lap time (s)" },
      );
      const [first, ...others] = selected;
      const deltas = others.length
        ? {
            reference: first.code,
            meaning: `Positive values: ${first.code} was faster on that lap by that many seconds; negative: the other driver was faster. Per-lap difference, not the race gap.`,
            chart: lapChart(
              labels,
              others.map((d) => ({
                name: `${d.code} − ${first.code}`,
                values: rows.map((row) =>
                  row[d.code] != null && row[first.code] != null ? round3((row[d.code] as number) - (row[first.code] as number)) : null,
                ),
              })),
              { xLabel: "Lap", yLabel: "Lap-time difference (s)" },
            ),
          }
        : undefined;
      return { session: label, scope, drivers: selected.map((d) => ({ code: d.code, name: d.name, team: d.team, teamColour: d.teamColour })), rows, chart, deltas, note };
    }

    const pool = refs?.length ? new Set(resolveDrivers(refs, drivers).map((d) => d.number)) : null;
    const considered = inRange.filter((l) => !pool || pool.has(l.driver_number));
    const ident = (n: number) => {
      const d = who.get(n);
      return { code: d?.code ?? String(n), name: d?.name ?? null, team: d?.team ?? null, teamColour: d?.teamColour ?? null };
    };

    if (view === "fastest") {
      const best = new Map<number, Lap>();
      for (const l of considered) {
        const cur = best.get(l.driver_number);
        if (l.lap_duration && (!cur || l.lap_duration < cur.lap_duration!)) best.set(l.driver_number, l);
      }
      const ranked = [...best.values()].sort((a, b) => a.lap_duration! - b.lap_duration!);
      const p1 = ranked[0]?.lap_duration ?? 0;
      const rows = ranked.slice(0, top ?? ranked.length).map((l, i) => ({
        rank: i + 1,
        ...ident(l.driver_number),
        lap: l.lap_number,
        time: formatLap(l.lap_duration),
        seconds: l.lap_duration,
        gap: i ? round3(l.lap_duration! - p1) : 0,
        s1: l.duration_sector_1,
        s2: l.duration_sector_2,
        s3: l.duration_sector_3,
        speedTrap: l.st_speed,
      }));
      return { session: label, scope, rows, note };
    }

    if (view === "pace") {
      const clean = cleanLaps(considered, pits);
      const rows = [...groupBy(clean, (l) => l.driver_number).entries()]
        .map(([n, list]) => {
          const t = list.map((l) => l.lap_duration!);
          const m = mean(t);
          return {
            ...ident(n),
            laps: t.length,
            median: round3(median(t)),
            mean: round3(m),
            spread: round3(Math.sqrt(mean(t.map((x) => (x - m) ** 2)))),
            best: round3(Math.min(...t)),
          };
        })
        .filter((row) => row.laps >= 3)
        .sort((a, b) => a.median - b.median)
        .map((row, i, all) => ({ rank: i + 1, ...row, gapToBest: round3(row.median - all[0].median) }));
      return {
        session: label,
        scope,
        rows: rows.slice(0, top ?? rows.length),
        note: joinNotes(note, "Pace uses each driver's representative laps: no lap 1, pit in/out laps, or laps slower than 107% of their median (safety car, traffic)."),
      };
    }

    // The remaining view, "sectors": each driver's best time in each sector.
    const rows = [...groupBy(considered, (l) => l.driver_number).entries()]
      .map(([n, list]) => {
        const bestOf = (k: "duration_sector_1" | "duration_sector_2" | "duration_sector_3") => {
          const v = list.map((l) => l[k]).filter((x): x is number => typeof x === "number" && x > 0);
          return v.length ? Math.min(...v) : null;
        };
        const s1 = bestOf("duration_sector_1");
        const s2 = bestOf("duration_sector_2");
        const s3 = bestOf("duration_sector_3");
        const bestLap = Math.min(...list.map((l) => l.lap_duration ?? Infinity));
        const theoretical = s1 && s2 && s3 ? round3(s1 + s2 + s3) : null;
        const speeds = list.map((l) => l.st_speed).filter((x): x is number => typeof x === "number");
        return {
          ...ident(n),
          s1,
          s2,
          s3,
          theoreticalBest: theoretical,
          theoreticalTime: formatLap(theoretical),
          bestLap: Number.isFinite(bestLap) ? bestLap : null,
          topSpeed: speeds.length ? Math.max(...speeds) : null,
        };
      })
      .sort((a, b) => (a.theoreticalBest ?? 999) - (b.theoreticalBest ?? 999));
    const fastestSector = (k: "s1" | "s2" | "s3") => {
      const hit = rows.filter((x) => x[k] != null).sort((a, b) => a[k]! - b[k]!)[0];
      return hit ? { code: hit.code, seconds: hit[k] } : null;
    };
    return {
      session: label,
      scope,
      rows: rows.slice(0, top ?? rows.length),
      fastestSectors: { s1: fastestSector("s1"), s2: fastestSector("s2"), s3: fastestSector("s3") },
      note,
    };
  },
});

// ── get_gaps ─────────────────────────────────────────────────────────────

export const getGaps = defineF1Tool({
  name: "get_gaps",
  description:
    "The race gap lap by lap, one row per lap: each driver's gap to the leader at the end of the lap, or the gap to a reference driver (positive = behind the reference), or the interval to the car ahead. Races and sprints only. Use for 'how did the gap between X and Y evolve' and race traces.",
  input: z.object({
    session: sessionArg(),
    drivers: driverList(6).optional().describe("One to six drivers (default the top three finishers)."),
    reference: z.string().max(30).default("leader").describe('"leader", or a driver code to measure everyone against that driver.'),
    metric: z.enum(["gap", "interval"]).default("gap").describe('"gap" to the leader/reference, or "interval" to the car directly ahead.'),
    ...lapRange,
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ lap: 20, VER: 1.2, LEC: 3.4 }],
    chart: { labels: ["20"], series: [{ name: "LEC", values: [2.2] }], xLabel: "Lap", yLabel: "Gap to VER (s)" },
    meaning: "Positive: seconds behind VER at the end of the lap.",
  },
  async run({ session: ref, drivers: refs, reference, metric, lap_start, lap_end }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    requireRaceLike(session, "Gap data");
    const [laps, drivers, intervals] = await Promise.all([
      getLaps(session, signal),
      sessionDrivers(session, signal),
      getIntervals(session, signal),
    ]);
    const selected = await pickDrivers(session, drivers, refs, 3, signal);
    const refDriver = reference && reference.toLowerCase() !== "leader" ? resolveDrivers([reference], drivers)[0] : null;
    const r = range(laps, lap_start, lap_end);
    const ends = lapEnds(laps);
    const samples = byDriver(intervals);
    let lappedSeen = false;
    let source = "OpenF1 intervals";

    // Gap to the leader at the end of each lap for one driver.
    const leaderGap = (d: number, lap: number): number | null => {
      const t = ends.get(d)?.get(lap);
      if (t === undefined) return null;
      const s = samples.get(d);
      const hit = s ? sampleAt(s.rows, s.times, t + 1500) : undefined;
      const value = metric === "interval" ? hit?.interval : hit?.gap_to_leader;
      if (typeof value === "string") lappedSeen = true;
      return numericGap(value ?? null);
    };
    // Fallback when intervals are missing: timing-line gaps from lap end times.
    const leaderEnd = (lap: number) => Math.min(...[...ends.values()].map((m) => m.get(lap) ?? Infinity));
    const lapGap = (d: number, lap: number) => {
      const t = ends.get(d)?.get(lap);
      const lead = leaderEnd(lap);
      return t === undefined || !Number.isFinite(lead) ? null : round3((t - lead) / 1000);
    };
    const useLaps = intervals.length === 0;
    if (useLaps) {
      source = "lap end times (OpenF1 intervals were empty)";
      if (metric === "interval") throw new RangeError("Intervals are not available for this session; ask for the gap instead.");
    }
    const gapOf = (d: number, lap: number) => (useLaps ? lapGap(d, lap) : leaderGap(d, lap));

    const show = refDriver && !selected.some((d) => d.number === refDriver.number) ? selected : selected.filter((d) => d.number !== refDriver?.number);
    const rows = r.list.map((lap) => {
      const row: Record<string, unknown> = { lap };
      const base = refDriver ? gapOf(refDriver.number, lap) : 0;
      for (const d of show) {
        const g = gapOf(d.number, lap);
        row[d.code] = g == null || base == null ? null : round3(refDriver && metric === "gap" ? g - base : g);
      }
      return row;
    });
    const against = metric === "interval" ? "the car ahead" : refDriver ? refDriver.code : "the leader";
    const chart = lapChart(
      r.list.map(String),
      show.map((d) => ({ name: d.code, values: rows.map((row) => row[d.code] as number | null) })),
      { xLabel: "Lap", yLabel: `${metric === "interval" ? "Interval" : "Gap"} to ${against} (s)` },
    );
    return {
      session: label,
      scope: `laps ${r.from}–${r.to}`,
      rows,
      chart,
      meaning: `Positive values: seconds behind ${against} at the end of each lap${refDriver && metric === "gap" ? "; negative: ahead of " + refDriver.code : ""}.`,
      note: joinNotes(
        note,
        lappedSeen && "Laps where a driver was a lap or more down show null.",
        refDriver && metric === "interval" && "Interval is always to the car directly ahead; the reference driver is ignored.",
        useLaps && `Source: ${source}.`,
      ),
    };
  },
});

// ── get_positions ────────────────────────────────────────────────────────

export const getPositions = defineF1Tool({
  name: "get_positions",
  description:
    "Running order lap by lap: one row per lap (lap 0 is the grid) with each driver's position, plus places gained and on-track overtakes per driver. Races and sprints. Use for position charts and 'who gained the most places'.",
  input: z.object({
    session: sessionArg(),
    drivers: driverList(22).optional().describe("Omit for the whole field."),
    ...lapRange,
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ lap: 0, RUS: 1, LEC: 2 }],
    chart: { labels: ["0"], series: [{ name: "RUS", values: [1] }], xLabel: "Lap", yLabel: "Position" },
    drivers: [{ code: "LEC", grid: 2, finish: 4, gained: -2, overtakes: 1, overtaken: 3 }],
  },
  async run({ session: ref, drivers: refs, lap_start, lap_end }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    requireRaceLike(session, "Position data");
    const [laps, drivers, positions, results, overtakes] = await Promise.all([
      getLaps(session, signal),
      sessionDrivers(session, signal),
      getPositionRows(session, signal),
      getSessionResult(session, signal),
      getOvertakes(session, signal),
    ]);
    const order = [...results].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).map((x) => x.driver_number);
    const selected = refs?.length
      ? resolveDrivers(refs, drivers)
      : [...drivers].sort((a, b) => (order.indexOf(a.number) + 1 || 99) - (order.indexOf(b.number) + 1 || 99));
    const r = range(laps, lap_start, lap_end);
    const ends = lapEnds(laps);
    const samples = byDriver(positions);
    const grid = await gridFor(session, signal);
    const posAt = (d: number, lap: number) => {
      if (lap === 0) return grid.get(d) ?? samples.get(d)?.rows[0]?.position ?? null;
      const t = ends.get(d)?.get(lap);
      const s = samples.get(d);
      if (t === undefined || !s) return null;
      return sampleAt(s.rows, s.times, t + 1500)?.position ?? null;
    };
    const lapsList = (lap_start ?? 1) <= 1 ? [0, ...r.list] : r.list;
    const resultOf = new Map(results.map((x) => [x.driver_number, x]));
    // A lapped car that finished never starts the leader's last laps; it holds its classified place.
    const heldAtFinish = (d: number, lap: number) => {
      const res = resultOf.get(d);
      return res?.position && !res.dnf && !res.dns && !res.dsq && res.number_of_laps != null && lap > res.number_of_laps
        ? res.position
        : null;
    };
    const rows = lapsList.map((lap) => {
      const row: Record<string, unknown> = { lap };
      for (const d of selected) row[d.code] = posAt(d.number, lap) ?? heldAtFinish(d.number, lap);
      return row;
    });
    const summary = selected.map((d) => {
      const res = resultOf.get(d.number);
      const g = grid.get(d.number) ?? null;
      const finish = res?.position ?? null;
      return {
        code: d.code,
        name: d.name,
        team: d.team,
        teamColour: d.teamColour,
        grid: g,
        finish,
        status: res?.dsq ? "DSQ" : res?.dns ? "DNS" : res?.dnf ? "DNF" : "Finished",
        gained: g && finish ? g - finish : null,
        overtakes: overtakes.filter((o) => o.overtaking_driver_number === d.number).length,
        overtaken: overtakes.filter((o) => o.overtaken_driver_number === d.number).length,
      };
    });
    return {
      session: label,
      scope: `laps ${lapsList[0]}–${r.to}`,
      rows,
      chart: lapChart(
        lapsList.map(String),
        selected.map((d) => ({ name: d.code, values: rows.map((row) => row[d.code] as number | null) })),
        { xLabel: "Lap", yLabel: "Position (1 = leader)" },
      ),
      drivers: summary,
      note: joinNotes(note, overtakes.length === 0 && "OpenF1 has no overtake data for this session."),
    };
  },
});

async function gridFor(session: Session, signal?: AbortSignal) {
  const qualiName = session.name === "Sprint" ? "Sprint Qualifying" : "Qualifying";
  const quali = (await allSessions(session.year, signal)).find((s) => s.meetingKey === session.meetingKey && s.name === qualiName);
  if (!quali) return new Map<number, number>();
  const sg = await getStartingGrid(quali, signal);
  if (sg.length) return new Map(sg.map((g) => [g.driver_number, g.position]));
  const qr = await getSessionResult(quali, signal);
  return new Map(qr.filter((q) => q.position).map((q) => [q.driver_number, q.position!]));
}

// ── get_stints ───────────────────────────────────────────────────────────

export const getStints = defineF1Tool({
  name: "get_stints",
  description:
    "Tyre strategy: one row per stint per driver (compound, first and last lap, length, tyre age at start, representative average lap), plus every pit stop (lap, pit-lane time, stationary time) and a one-line strategy per driver. Works for any session; pit stops for races and sprints.",
  input: z.object({
    session: sessionArg("session"),
    drivers: driverList(22).optional().describe("Omit for the whole field (ordered by finishing position)."),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ code: "LEC", stint: 1, compound: "SOFT", lapStart: 1, lapEnd: 31, laps: 31, tyreAgeAtStart: 0, avgLap: 108.9 }],
    pitStops: [{ code: "LEC", lap: 31, pitLane: 20.7, stationary: 2.4 }],
    strategies: [{ code: "LEC", strategy: "SOFT 31 → MEDIUM 5 → MEDIUM 15", stops: 2 }],
  },
  async run({ session: ref, drivers: refs }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    const raceLike = session.name === "Race" || session.name === "Sprint";
    const [stints, drivers, laps, pits, results] = await Promise.all([
      getStintRows(session, signal),
      sessionDrivers(session, signal),
      getLaps(session, signal),
      raceLike ? getPits(session, signal) : Promise.resolve([] as Pit[]),
      getSessionResult(session, signal),
    ]);
    const order = [...results].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).map((x) => x.driver_number);
    const selected = refs?.length
      ? resolveDrivers(refs, drivers)
      : [...drivers].sort((a, b) => (order.indexOf(a.number) + 1 || 99) - (order.indexOf(b.number) + 1 || 99));
    const clean = cleanLaps(laps, pits);
    const rows: Record<string, unknown>[] = [];
    const strategies: Record<string, unknown>[] = [];
    for (const d of selected) {
      const mine = stints
        .filter((s: Stint) => s.driver_number === d.number)
        .sort((a, b) => a.stint_number - b.stint_number);
      for (const s of mine) {
        const t = clean
          .filter((l) => l.driver_number === d.number && s.lap_start != null && s.lap_end != null && l.lap_number >= s.lap_start && l.lap_number <= s.lap_end)
          .map((l) => l.lap_duration!);
        rows.push({
          code: d.code,
          name: d.name,
          teamColour: d.teamColour,
          stint: s.stint_number,
          compound: s.compound,
          lapStart: s.lap_start,
          lapEnd: s.lap_end,
          laps: s.lap_start != null && s.lap_end != null ? s.lap_end - s.lap_start + 1 : null,
          tyreAgeAtStart: s.tyre_age_at_start,
          avgLap: t.length >= 2 ? round3(mean(t)) : null,
        });
      }
      if (mine.length)
        strategies.push({
          code: d.code,
          strategy: mine.map((s) => `${s.compound ?? "?"} ${s.lap_start != null && s.lap_end != null ? s.lap_end - s.lap_start + 1 : "?"}`).join(" → "),
          stops: raceLike ? pits.filter((p) => p.driver_number === d.number).length : null,
        });
    }
    const codes = new Set(selected.map((d) => d.number));
    const who = driverMap(drivers);
    const pitStops = pits
      .filter((p) => codes.has(p.driver_number))
      .sort((a, b) => a.lap_number - b.lap_number)
      .map((p) => ({
        code: who.get(p.driver_number)?.code ?? String(p.driver_number),
        lap: p.lap_number,
        pitLane: p.lane_duration ?? p.pit_duration ?? null,
        stationary: p.stop_duration ?? null,
      }));
    return {
      session: label,
      rows,
      ...(raceLike ? { pitStops } : {}),
      strategies,
      note: joinNotes(
        note,
        raceLike && pitStops.length > 0 && pitStops.every((p) => p.stationary == null) && "OpenF1 gives pit-lane time only (no stationary time) for this race.",
        "avgLap is the mean of representative laps in the stint (no pit, lap 1 or slow laps).",
      ),
    };
  },
});

// ── get_race_control ─────────────────────────────────────────────────────

const CATEGORY_FILTERS = {
  all: () => true,
  flags: (m: { category: string }) => m.category === "Flag",
  safety_car: (m: { category: string; message: string }) => m.category === "SafetyCar" || /SAFETY CAR|VSC|RED FLAG/i.test(m.message),
  penalties: (m: { message: string }) => /PENALTY|STEWARDS|INVESTIGATION|REPRIMAND|TIME DELETED|DISQUALIF|WARNING/i.test(m.message),
  incidents: (m: { message: string }) => /INCIDENT|INVESTIGATION|NOTED|CAR \d+ .*(STOPPED|SPUN|CRASH)|STOPPED/i.test(m.message),
  drs: (m: { category: string }) => m.category === "Drs",
} as const;

export const getRaceControl = defineF1Tool({
  name: "get_race_control",
  description:
    "Race control messages for a session: flags, safety cars and VSCs, red flags, investigations and penalties, track limits. Filter by category or driver. Each row has the lap, UTC time, category, flag and message, plus counts of safety cars, VSCs, red flags and penalties.",
  input: z.object({
    session: sessionArg("session"),
    category: z.enum(["all", "flags", "safety_car", "penalties", "incidents", "drs"]).default("all"),
    driver: z.string().max(30).optional().describe("Only messages about this driver."),
    include_sector_clears: z.boolean().default(false).describe("Keep routine 'CLEAR IN TRACK SECTOR' messages."),
    limit: z.number().int().min(1).max(200).default(60),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ lap: 12, time: "11:24:03", category: "SafetyCar", flag: null, driver: null, message: "SAFETY CAR DEPLOYED" }],
    counts: { safetyCars: 1, virtualSafetyCars: 0, redFlags: 0, penalties: 2 },
  },
  async run({ session: ref, category, driver, include_sector_clears, limit }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    const [messages, drivers] = await Promise.all([getRaceControlRows(session, signal), sessionDrivers(session, signal)]);
    const who = driverMap(drivers);
    const target = driver ? resolveDrivers([driver], drivers)[0] : null;
    const filtered = messages
      .filter((m) => include_sector_clears || !(m.flag === "CLEAR" && m.scope === "Sector"))
      .filter(CATEGORY_FILTERS[category])
      .filter((m) => !target || m.driver_number === target.number || new RegExp(`\\bCAR ${target.number}\\b|\\b${target.code}\\b`).test(m.message))
      .sort((a, b) => a.date.localeCompare(b.date));
    const counts = {
      safetyCars: messages.filter((m) => /^SAFETY CAR DEPLOYED/i.test(m.message)).length,
      virtualSafetyCars: messages.filter((m) => /^VIRTUAL SAFETY CAR DEPLOYED|^VSC DEPLOYED/i.test(m.message)).length,
      redFlags: messages.filter((m) => m.flag === "RED" || /^RED FLAG/i.test(m.message)).length,
      penalties: messages.filter((m) => /PENALTY/i.test(m.message) && !/NO FURTHER|NO PENALTY/i.test(m.message)).length,
    };
    const rows = filtered.slice(0, limit).map((m) => ({
      lap: m.lap_number,
      time: m.date.slice(11, 19),
      category: m.category,
      flag: m.flag,
      driver: m.driver_number ? (who.get(m.driver_number)?.code ?? String(m.driver_number)) : null,
      message: m.message,
      ...(m.qualifying_phase ? { qualifyingPhase: m.qualifying_phase } : {}),
    }));
    return {
      session: label,
      rows,
      counts,
      note: joinNotes(note, filtered.length > limit && `Showing the first ${limit} of ${filtered.length} matching messages.`),
    };
  },
});

// ── get_timing_tower ─────────────────────────────────────────────────────

export const getTimingTower = defineF1Tool({
  name: "get_timing_tower",
  description:
    "The timing tower at the end of a given lap (default the final lap): position, gap to leader, interval, last lap, best lap so far, current tyre and age, and stops made. Races and sprints. Use for 'what did the order look like on lap 30' or a race replay.",
  input: z.object({
    session: sessionArg(),
    lap: z.number().int().min(1).max(90).optional().describe("Lap number (default the final lap)."),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    lap: 30,
    rows: [{ position: 1, code: "RUS", name: "George Russell", teamColour: "#00D7B6", gap: null, interval: null, lastLap: "1:47.021", bestLap: "1:46.330", compound: "MEDIUM", tyreAge: 12, stops: 1, status: "running" }],
  },
  async run({ session: ref, lap }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    requireRaceLike(session, "The timing tower");
    const [laps, drivers, intervals, positions, stints, pits, results] = await Promise.all([
      getLaps(session, signal),
      sessionDrivers(session, signal),
      getIntervals(session, signal),
      getPositionRows(session, signal),
      getStintRows(session, signal),
      getPits(session, signal),
      getSessionResult(session, signal),
    ]);
    const r = range(laps, lap, lap);
    const target = lap ?? r.last;
    const ends = lapEnds(laps);
    // The moment the leader completed the target lap.
    const t = Math.min(...[...ends.values()].map((m) => m.get(target) ?? Infinity));
    if (!Number.isFinite(t)) throw new RangeError(`No timing for lap ${target}.`);
    const iv = byDriver(intervals);
    const pos = byDriver(positions);
    const resultOf = new Map(results.map((x) => [x.driver_number, x]));
    const rows = drivers
      .map((d) => {
        // Each car as it crossed the line to finish the lap (or, if it never did, when the leader did).
        const at = ends.get(d.number)?.get(target) ?? t;
        const mine = laps.filter((l) => l.driver_number === d.number);
        const done = mine.filter((l) => l.lap_number <= target && (ends.get(d.number)?.get(l.lap_number) ?? Infinity) <= at + 1500);
        const current = done.at(-1);
        const best = Math.min(...done.map((l) => l.lap_duration ?? Infinity));
        const onLap = (current?.lap_number ?? 0) + 1;
        const stint = stints.find(
          (s) => s.driver_number === d.number && s.lap_start != null && s.lap_start <= onLap && (s.lap_end ?? 999) >= Math.min(onLap, current?.lap_number ?? 1),
        );
        const ivs = iv.get(d.number);
        const sample = ivs ? sampleAt(ivs.rows, ivs.times, at + 1500) : undefined;
        const ps = pos.get(d.number);
        const position = ps ? sampleAt(ps.rows, ps.times, at + 1500)?.position ?? null : null;
        const res = resultOf.get(d.number);
        const retired = !!res && (res.dnf || res.dns || res.dsq) && (res.number_of_laps ?? 0) < target;
        return {
          position,
          code: d.code,
          name: d.name,
          team: d.team,
          teamColour: d.teamColour,
          gap: retired ? null : typeof sample?.gap_to_leader === "number" ? round3(sample.gap_to_leader) : (sample?.gap_to_leader ?? null),
          interval: retired ? null : typeof sample?.interval === "number" ? round3(sample.interval) : (sample?.interval ?? null),
          lapsCompleted: current?.lap_number ?? 0,
          lastLap: formatLap(current?.lap_duration),
          bestLap: Number.isFinite(best) ? formatLap(best) : null,
          compound: stint?.compound ?? null,
          tyreAge: stint && stint.lap_start != null ? (stint.tyre_age_at_start ?? 0) + (current?.lap_number ?? 0) - stint.lap_start + 1 : null,
          stops: pits.filter((p) => p.driver_number === d.number && p.lap_number <= target).length,
          status: retired ? "out" : "running",
        };
      })
      .sort((a, b) => (a.status === b.status ? (a.position ?? 99) - (b.position ?? 99) : a.status === "out" ? 1 : -1));
    return {
      session: label,
      lap: target,
      totalLaps: r.last,
      rows,
      note: joinNotes(note, "Each row is taken as that car completed the lap; retired cars are listed last."),
    };
  },
});
