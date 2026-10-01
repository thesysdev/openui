"use client";

// The F1 special charts (f1-charts-special/) as OpenUI components the agent can generate.
// The agent names what it wants in the tools' own words, a session and some drivers, and each
// chart fetches its rows from the F1 tools (POST /api/f1/[tool]) and draws them. A last `data`
// argument takes raw rows instead, for when the agent already holds them or no tool covers it.
// Kept apart from f1-genui.tsx, which the special charts import their lookups from.
import { defineComponent } from "@openuidev/react-lang";
import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod/v4";
import {
  ChampionshipProgress as ChampionshipProgressChart,
  GapChart as GapChartChart,
  HeadToHeadBars as HeadToHeadBarsChart,
  LapTimes as LapTimesChart,
  RaceTrace as RaceTraceChart,
  RankedBars as RankedBarsChart,
  Sparkline as SparklineChart,
  StatCallout as StatCalloutChart,
  StintBar as StintBarChart,
} from "./f1-charts-special/f1-charts-special";
import "./f1-charts-genui.css";

type Row = Record<string, unknown>;
type ToolResult = { session?: string; rows?: Row[]; note?: string; [k: string]: unknown };

/* ---------------------------------------------------------------- fetching */

// One request per distinct call, shared by every chart and kept for the page's life, so a chart
// that re-renders while the answer streams (or two charts on the same race) fetch once.
const cache = new Map<string, Promise<ToolResult>>();

function callTool(tool: string, args: Row): Promise<ToolResult> {
  const key = `${tool} ${JSON.stringify(args)}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = fetch(`/api/f1/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    }).then(async (res) => {
      const body = (await res.json().catch(() => ({}))) as ToolResult & { error?: string };
      if (!res.ok || body.error) throw new Error(body.error ?? `HTTP ${res.status}`);
      return body;
    });
    hit.catch(() => cache.delete(key));
    cache.set(key, hit);
  }
  return hit;
}

type Load<T> = { state: "loading" } | { state: "ready"; value: T } | { state: "empty" };

/** Runs `load` once its key settles (arguments still streaming in change it), unless raw data
    was given. An empty or failed result is "empty". */
function useChartData<T>(key: string, load: () => Promise<T | null>, raw?: T | null): Load<T> {
  const [result, setResult] = useState<Load<T>>({ state: "loading" });
  useEffect(() => {
    if (raw != null) return;
    let live = true;
    setResult({ state: "loading" });
    const timer = setTimeout(() => {
      load()
        .then((value) => live && setResult(value == null ? { state: "empty" } : { state: "ready", value }))
        .catch(() => live && setResult({ state: "empty" }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // `load` is rebuilt every render; `key` carries everything it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, raw == null]);
  return raw != null ? { state: "ready", value: raw } : result;
}

/** While loading: the chart's panel at its final height with its title, so nothing shifts. When
    nothing came back: one quiet line in the same panel. */
// Drawn heights measured on /component with a title (20px line + 12px margin); without one the
// panel is that much shorter. Keep these in step with the charts so nothing shifts on arrival.
const TITLE_H = 32;

function Pending({ load, title, height, children }: { load: Load<unknown>; title?: string; height: number; children: () => ReactNode }) {
  if (load.state === "ready") return <>{children()}</>;
  height -= title ? 0 : TITLE_H;
  return (
    <figure className={`f1-chart f1-chart-pending${load.state === "empty" ? " is-empty" : ""}`} style={{ minHeight: height }}>
      {title && <figcaption className="f1-chart-title">{title}</figcaption>}
      {load.state === "empty" ? (
        <p className="f1-chart-empty">No data for this chart.</p>
      ) : (
        // The block-by-block loader's own board (.f1-settle in stream-settle.css), laid behind the
        // title, so a loading chart and a streaming block always look and move the same.
        <div className="f1-settle f1-chart-board" aria-hidden />
      )}
    </figure>
  );
}

const codes = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : undefined);
const rowsOf = (r: ToolResult) => (Array.isArray(r.rows) && r.rows.length ? r.rows : null);
const chunks = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

/** The top `n` finishers' codes of a session, for charts asked about "the top six". */
async function topCodes(session: string, n: number) {
  const res = await callTool("get_results", { session, top: n });
  return (res.rows ?? []).map((r) => String(r.code)).filter(Boolean).slice(0, n);
}

/** Lap rows for any number of drivers (the tool takes four at a time), merged by lap. */
async function lapRows(session: string, drivers: string[]) {
  const parts = await Promise.all(chunks(drivers, 4).map((d) => callTool("get_lap_times", { session, view: "laps", drivers: d })));
  const byLap = new Map<number, Row>();
  for (const part of parts)
    for (const row of part.rows ?? []) {
      const lap = Number(row.lap);
      byLap.set(lap, { ...byLap.get(lap), ...row });
    }
  return byLap.size ? [...byLap.values()].sort((a, b) => Number(a.lap) - Number(b.lap)) : null;
}

/* ---------------------------------------------------------------- schemas */

const session = z.string().optional();
const drivers = z.array(z.string()).optional();
const title = z.string().optional();
const rawRows = z.array(z.record(z.string(), z.any())).optional();
const stint = z.object({
  code: z.string(),
  compound: z.string().nullable(),
  lapStart: z.number().nullable(),
  lapEnd: z.number().nullable(),
  laps: z.number().nullable().optional(),
  tyreAgeAtStart: z.number().nullable().optional(),
  stint: z.number().optional(),
});
type Stint = z.infer<typeof stint>;

const SESSION_WORDS =
  'session: the tools\' words, "latest" (default), "Baku", "2025 Spa", "round 5", "Miami qualifying".';
const DATA_WORDS =
  "The chart fetches its own data from the F1 tools; never paste series into it. data: raw rows only when a tool can't produce them.";

/* ---------------------------------------------------------------- charts */

export const GapChart = defineComponent({
  name: "GapChart",
  props: z.object({ session, drivers, title, reference: z.string().optional(), data: rawRows }),
  description: `Each car's gap by lap in a race, line ends labelled, pit laps marked. ${SESSION_WORDS} drivers: up to six codes (default: the top four finishers). reference: a driver code to measure against instead of the leader. ${DATA_WORDS} (get_gaps rows).`,
  component: ({ props }) => {
    const s = props.session ?? "latest";
    const ds = codes(props.drivers);
    const ref = props.reference && props.reference.toLowerCase() !== "leader" ? props.reference : undefined;
    const load = useChartData(
      JSON.stringify(["gap", s, ds, ref]),
      async () => {
        const who = ds?.length ? ds.slice(0, 6) : await topCodes(s, 4);
        const [gaps, stints] = await Promise.all([
          callTool("get_gaps", { session: s, drivers: who, ...(ref ? { reference: ref } : {}) }),
          callTool("get_stints", { session: s, drivers: who }).catch(() => ({}) as ToolResult),
        ]);
        const rows = rowsOf(gaps);
        if (!rows) return null;
        const pits = (Array.isArray(stints.pitStops) ? (stints.pitStops as { code: string; lap: number }[]) : []).filter((p) => who.includes(p.code));
        return { rows, pits };
      },
      props.data ? { rows: props.data as Row[], pits: [] } : null,
    );
    return (
      <Pending load={load} title={props.title} height={363}>
        {() => load.state === "ready" && (
          <GapChartChart
            rows={load.value.rows}
            pits={load.value.pits}
            title={props.title}
            yLabel={ref ? `Gap to ${ref.toUpperCase()} (s)` : undefined}
          />
        )}
      </Pending>
    );
  },
});

export const RaceTrace = defineComponent({
  name: "RaceTrace",
  props: z.object({ session, drivers, title, data: rawRows }),
  description: `Race trace: each car's running time against the winner's average pace, lap by lap. Above zero is ahead of that pace; pit stops and safety cars show as drops and bunching. ${SESSION_WORDS} drivers: up to eight codes (default: the top six finishers). ${DATA_WORDS} (get_lap_times rows).`,
  component: ({ props }) => {
    const s = props.session ?? "latest";
    const ds = codes(props.drivers);
    const load = useChartData(
      JSON.stringify(["trace", s, ds]),
      async () => lapRows(s, ds?.length ? ds.slice(0, 8) : await topCodes(s, 6)),
      (props.data as Row[] | undefined) ?? null,
    );
    return (
      <Pending load={load} title={props.title} height={361}>
        {() => load.state === "ready" && <RaceTraceChart rows={load.value} title={props.title} />}
      </Pending>
    );
  },
});

export const LapTimes = defineComponent({
  name: "LapTimes",
  props: z.object({ session, drivers, title, data: rawRows }),
  description: `Lap times by lap for one or two drivers, dots coloured by tyre compound, pit laps flagged. ${SESSION_WORDS} drivers: one or two codes (default: the winner). ${DATA_WORDS} (get_lap_times rows).`,
  component: ({ props }) => {
    const s = props.session ?? "latest";
    const ds = codes(props.drivers);
    const load = useChartData(
      JSON.stringify(["laps", s, ds]),
      async () => {
        const who = ds?.length ? ds.slice(0, 2) : await topCodes(s, 1);
        const [rows, stints] = await Promise.all([
          lapRows(s, who),
          callTool("get_stints", { session: s, drivers: who }).catch(() => ({}) as ToolResult),
        ]);
        return rows ? { rows, stints: (stints.rows ?? []) as unknown as Stint[] } : null;
      },
      props.data ? { rows: props.data as Row[], stints: [] } : null,
    );
    return (
      <Pending load={load} title={props.title} height={392}>
        {() => load.state === "ready" && <LapTimesChart rows={load.value.rows} stints={load.value.stints} title={props.title} />}
      </Pending>
    );
  },
});

const MEASURES = {
  "gap to pole": { tool: "get_results", key: "gapToPole", format: "gap", order: "asc", unit: undefined },
  "best lap": { tool: "get_results", key: "bestSeconds", format: "time", order: "asc", unit: undefined },
  "fastest lap": { tool: "get_results", key: "fastestLapSeconds", format: "time", order: "asc", unit: undefined },
  "positions gained": { tool: "get_results", key: "gained", format: "number", order: "desc", unit: "places" },
  "race points": { tool: "get_results", key: "points", format: "number", order: "desc", unit: "pts" },
  "championship points": { tool: "get_standings", key: "points", format: "number", order: "desc", unit: "pts" },
} as const;
type Measure = keyof typeof MEASURES;

export const RankedBars = defineComponent({
  name: "RankedBars",
  props: z.object({
    session,
    measure: z.enum(Object.keys(MEASURES) as [Measure, ...Measure[]]).optional(),
    title,
    top: z.number().optional(),
    data: z.array(z.object({ code: z.string(), value: z.number() })).optional(),
    format: z.enum(["gap", "time", "number"]).optional(),
  }),
  description: `Horizontal bars ranking drivers on one measure, in team colours with avatars. ${SESSION_WORDS} measure: "gap to pole" or "best lap" (a qualifying session), "fastest lap", "positions gained" or "race points" (a race), "championship points" (season, session ignored). top: how many drivers (default 10). ${DATA_WORDS} data: [{ code, value }] in rank order, with format "gap" | "time" | "number".`,
  component: ({ props }) => {
    const s = props.session ?? "latest";
    const m = MEASURES[props.measure ?? "gap to pole"];
    const top = Math.min(Math.max(props.top ?? 10, 2), 22);
    const load = useChartData(
      JSON.stringify(["ranked", s, props.measure, top]),
      async () => {
        const res = m.tool === "get_standings" ? await callTool("get_standings", { view: "table" }) : await callTool("get_results", { session: s });
        const rows = (res.rows ?? [])
          .filter((r) => typeof r[m.key] === "number" && r.code)
          .map((r) => ({ code: String(r.code), value: r[m.key] as number }))
          .sort((a, b) => (m.order === "asc" ? a.value - b.value : b.value - a.value))
          .slice(0, top);
        // A gap to pole leaves out the pole sitter's zero.
        const shown = m.key === "gapToPole" ? rows.filter((r) => r.value > 0) : rows;
        return shown.length ? shown : null;
      },
      props.data ?? null,
    );
    const format = props.data ? props.format : m.format;
    return (
      <Pending load={load} title={props.title} height={54 + 30 * (props.measure === "gap to pole" || !props.measure ? top - 1 : top)}>
        {() => load.state === "ready" && (
          <RankedBarsChart rows={load.value} title={props.title} format={format} unit={props.data ? undefined : m.unit} />
        )}
      </Pending>
    );
  },
});

/** Two drivers in one session: finish, grid, places gained, fastest lap and points. */
async function sessionMeasures(s: string, pair: [string, string]) {
  const res = await callTool("get_results", { session: s });
  const [a, b] = pair.map((c) => (res.rows ?? []).find((r) => r.code === c));
  if (!a || !b) return null;
  const n = (r: Row, k: string) => (typeof r[k] === "number" ? (r[k] as number) : null);
  const measures: { label: string; values: [number, number]; better?: "higher" | "lower" }[] = [];
  const add = (label: string, k: string, better: "higher" | "lower") => {
    const [x, y] = [n(a, k), n(b, k)];
    if (x != null && y != null) measures.push({ label, values: [x, y], better });
  };
  add("Finish", "position", "lower");
  add("Grid", "grid", "lower");
  add("Places gained", "gained", "higher");
  add("Fastest lap (s)", "fastestLapSeconds", "lower");
  add("Points", "points", "higher");
  return measures.length ? measures : null;
}

/** Two drivers over the season so far, from each round's race result and the standings. */
async function seasonMeasures(pair: [string, string]) {
  const prog = await callTool("get_standings", { view: "progression", drivers: pair });
  const rounds = (prog.rows ?? []).map((r) => Number(r.round)).filter(Boolean);
  if (!rounds.length) return null;
  const results = await Promise.all(rounds.map((r) => callTool("get_results", { session: `round ${r}` }).catch(() => ({}) as ToolResult)));
  const s = pair.map(() => ({ wins: 0, podiums: 0, ahead: 0, finishes: [] as number[] }));
  for (const res of results) {
    const pos = pair.map((c) => (res.rows ?? []).find((r) => r.code === c));
    pos.forEach((r, i) => {
      if (!r || typeof r.position !== "number") return;
      if (r.position === 1) s[i].wins++;
      if (r.position <= 3) s[i].podiums++;
      if (r.status === "Finished") s[i].finishes.push(r.position);
    });
    const [x, y] = pos.map((r) => r?.position as number | undefined);
    if (x && y) s[x < y ? 0 : 1].ahead++;
  }
  const last = prog.rows?.at(-1) ?? {};
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((t, v) => t + v, 0) / xs.length) * 10) / 10 : 0);
  const two = (f: (i: number) => number) => [f(0), f(1)] as [number, number];
  return [
    { label: "Points", values: two((i) => Number(last[pair[i]] ?? 0)) },
    { label: "Wins", values: two((i) => s[i].wins) },
    { label: "Podiums", values: two((i) => s[i].podiums) },
    { label: "Ahead in the race", values: two((i) => s[i].ahead) },
    { label: "Average finish", values: two((i) => avg(s[i].finishes)), better: "lower" as const },
  ];
}

const measure = z.object({ label: z.string(), values: z.array(z.number()), better: z.enum(["higher", "lower"]).optional() });

export const HeadToHeadBars = defineComponent({
  name: "HeadToHeadBars",
  props: z.object({ drivers: z.array(z.string()), session, title, data: z.array(measure).optional() }),
  description: `Two drivers side by side across several measures, the better side highlighted. drivers: two codes ["LEC", "HAM"]. session: "season" (default) compares points, wins, podiums, who finished ahead and average finish so far; a race ("Baku") compares finish, grid, places gained, fastest lap and points. ${DATA_WORDS} data: [{ label, values: [a, b], better: "higher" | "lower" }].`,
  component: ({ props }) => {
    const pair = [props.drivers[0] ?? "", props.drivers[1] ?? ""] as [string, string];
    const s = props.session ?? "season";
    const load = useChartData(
      JSON.stringify(["h2h", pair, s]),
      async () => (!pair[0] || !pair[1] ? null : s.toLowerCase() === "season" ? seasonMeasures(pair) : sessionMeasures(s, pair)),
      props.data
        ? props.data.map((m) => ({ ...m, values: [m.values[0] ?? 0, m.values[1] ?? 0] as [number, number] }))
        : null,
    );
    return (
      <Pending load={load} title={props.title} height={390}>
        {() => load.state === "ready" && <HeadToHeadBarsChart drivers={pair} measures={load.value} title={props.title} />}
      </Pending>
    );
  },
});

export const StintBar = defineComponent({
  name: "StintBar",
  props: z.object({ session, drivers, title, top: z.number().optional(), data: z.array(stint).optional() }),
  description: `Tyre strategy: one bar per driver split into stints by compound colour, with stint lengths. ${SESSION_WORDS} drivers: codes to show; otherwise the top finishers in order. top: how many finishers (default 10). ${DATA_WORDS} (get_stints rows).`,
  component: ({ props }) => {
    const s = props.session ?? "latest";
    const ds = codes(props.drivers);
    const top = Math.min(Math.max(props.top ?? 10, 1), 22);
    const load = useChartData(
      JSON.stringify(["stints", s, ds, top]),
      async () => {
        const order = ds?.length ? ds : await topCodes(s, top);
        const res = await callTool("get_stints", { session: s, drivers: order });
        const rows = ((res.rows ?? []) as unknown as Stint[]).filter((r) => order.includes(r.code));
        rows.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code) || (a.stint ?? 0) - (b.stint ?? 0));
        return rows.length ? rows : null;
      },
      (props.data as Stint[] | undefined) ?? null,
    );
    const count = ds?.length ?? top;
    return (
      <Pending load={load} title={props.title} height={132 + 28 * count}>
        {() => load.state === "ready" && <StintBarChart rows={load.value} title={props.title} />}
      </Pending>
    );
  },
});

export const ChampionshipProgress = defineComponent({
  name: "ChampionshipProgress",
  props: z.object({ drivers, title, mode: z.enum(["points", "gap"]).optional(), data: rawRows }),
  description: `Drivers' championship points by round this season, a line per driver, the circuit in the tooltip. drivers: up to eight codes (default: the top five). mode: "points" (default) cumulative points, "gap" points behind the leader. ${DATA_WORDS} (get_standings view "progression" rows).`,
  component: ({ props }) => {
    const ds = codes(props.drivers);
    const load = useChartData(
      JSON.stringify(["progress", ds]),
      async () => rowsOf(await callTool("get_standings", { view: "progression", ...(ds?.length ? { drivers: ds.slice(0, 8) } : { top: 5 }) })),
      (props.data as Row[] | undefined) ?? null,
    );
    return (
      <Pending load={load} title={props.title} height={361}>
        {() => load.state === "ready" && <ChampionshipProgressChart rows={load.value} title={props.title} mode={props.mode} />}
      </Pending>
    );
  },
});

export const StatCallout = defineComponent({
  name: "StatCallout",
  props: z.object({
    label: z.string(),
    value: z.string(),
    unit: z.string().optional(),
    note: z.string().optional(),
    driver: z.string().optional(),
  }),
  description:
    'One big number with its label, for the headline figure of an answer, using a value from a tool result. value is text as shown ("0.196", "1:44.916"). unit: e.g. "s". note: one short line of context. driver: a code, which adds the driver\'s number disc beside the label.',
  component: ({ props }) => (
    <StatCalloutChart label={props.label} value={props.value} unit={props.unit} note={props.note} driver={props.driver} />
  ),
});

export const Sparkline = defineComponent({
  name: "Sparkline",
  props: z.object({ driver: z.string(), data: z.array(z.number()).optional(), labels: z.array(z.string()).optional() }),
  description: `A small inline trend of a driver's championship points through the season, for a table cell or beside a StatCallout. driver: a code, which also sets the team colour. ${DATA_WORDS} data: numbers in order, with labels naming each one.`,
  component: ({ props }) => {
    const d = props.driver;
    const load = useChartData(
      JSON.stringify(["spark", d]),
      async () => {
        const rows = rowsOf(await callTool("get_standings", { view: "progression", drivers: [d] }));
        if (!rows) return null;
        return { values: rows.map((r) => Number(r[d] ?? 0)), labels: rows.map((r) => String(r.circuit ?? r.round)) };
      },
      props.data ? { values: props.data, labels: props.labels ?? [] } : null,
    );
    if (load.state !== "ready") return <span className="f1-settle f1-spark-pending" aria-hidden />;
    return <SparklineChart values={load.value.values} labels={load.value.labels} driver={d} format={(v) => `${v} pts`} />;
  },
});

export const f1Charts = [
  GapChart,
  RaceTrace,
  LapTimes,
  RankedBars,
  HeadToHeadBars,
  StintBar,
  ChampionshipProgress,
  StatCallout,
  Sparkline,
];
