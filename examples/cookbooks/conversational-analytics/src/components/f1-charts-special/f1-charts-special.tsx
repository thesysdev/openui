"use client";

// F1-specific charts. Each takes rows shaped like the F1 tools' output (driver codes as keys or
// a `code` field) and owns every visual choice: team colours, tyre colours, scales and labels.
import { DriverAvatar, teamColour } from "../f1-assets";
import { findDriver } from "../f1-genui";
import {
  CARBON,
  ChartPanel,
  LegendItem,
  LinePlot,
  Plot,
  TYRES,
  codesIn,
  driverColours,
  lapTicks,
  lapTime,
  linear,
  niceTicks,
  tyre,
  type LineSeries,
} from "./chart-kit";

type Row = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/* GapChart: each car's gap to the leader (or a reference car) by lap, pit laps marked. */

export function GapChart({
  rows,
  title,
  pits = [],
  yLabel = "Gap to leader (s)",
}: {
  /** One row per lap: { lap, RUS: 0, LEC: 1.763 }. */
  rows: Row[];
  title?: string;
  /** Pit stops to mark: { code, lap }. */
  pits?: { code: string; lap: number }[];
  yLabel?: string;
}) {
  const codes = codesIn(rows, ["lap"]);
  const colours = driverColours(codes);
  const laps = rows.map((r) => Number(r.lap));
  const series: LineSeries[] = codes.map((code) => ({
    code,
    colour: colours.get(code)!,
    points: rows.map((r) => [Number(r.lap), num(r[code])]),
    marks: pits.filter((p) => p.code === code).map((p) => p.lap),
  }));
  return (
    <ChartPanel title={title} yLabel={yLabel} xLabel="Lap" note={pits.length ? "Dots mark pit stops" : undefined}>
      <LinePlot series={series} yReverse yZero xTicks={lapTicks(Math.min(...laps), Math.max(...laps))} />
    </ChartPanel>
  );
}

/* RaceTrace: each car's running time against the winner's average pace. Above zero is ahead of
   that pace; pit stops and safety cars show as drops and bunching. */

export function RaceTrace({ rows, title }: { /** Lap times: { lap, RUS: 107.4, LEC: 108.1 }. */ rows: Row[]; title?: string }) {
  const codes = codesIn(rows, ["lap"]).filter((c) => !c.endsWith("_note"));
  const colours = driverColours(codes);
  const sorted = [...rows].sort((a, b) => Number(a.lap) - Number(b.lap));
  const totals = new Map<string, [number, number | null][]>();
  for (const code of codes) {
    let t = 0;
    let broken = false;
    totals.set(
      code,
      sorted.map((r) => {
        const v = num(r[code]);
        if (broken || v == null) {
          broken = true;
          return [Number(r.lap), null];
        }
        t += v;
        return [Number(r.lap), t];
      }),
    );
  }
  // Reference: whoever covered the most laps in the least time. On green-flag laps the reference
  // runs at their average clean lap; on neutralised laps (safety car, red flag, over 107% of their
  // median) it runs at their actual time, so those laps don't swamp the chart.
  const ref = codes
    .map((code) => {
      const done = totals.get(code)!.filter((p) => p[1] != null);
      return { code, laps: done.length, time: done.at(-1)?.[1] ?? Infinity };
    })
    .sort((a, b) => b.laps - a.laps || a.time - b.time)[0]?.code;
  const refTimes = sorted.map((r) => (ref ? num(r[ref]) : null));
  const median = [...refTimes].filter((v): v is number => v != null).sort((a, b) => a - b)[Math.floor(refTimes.length / 2)] ?? 0;
  const clean = sorted.map((r, i) => {
    const t = refTimes[i];
    return t != null && t <= median * 1.07 && !(ref && r[`${ref}_note`]) && Number(r.lap) !== 1;
  });
  const cleanTimes = refTimes.filter((t, i): t is number => clean[i] && t != null);
  const pace = cleanTimes.reduce((sum, t) => sum + t, 0) / (cleanTimes.length || 1);
  let refTotal = 0;
  const refCum = sorted.map((_, i) => (refTotal += clean[i] ? pace : (refTimes[i] ?? pace)));
  const series: LineSeries[] = codes.map((code) => ({
    code,
    colour: colours.get(code)!,
    points: totals.get(code)!.map(([lap, t], i) => [lap, t == null ? null : Math.round((refCum[i] - t) * 1000) / 1000]),
  }));
  const laps = sorted.map((r) => Number(r.lap));
  return (
    <ChartPanel title={title} yLabel={`Vs ${ref ?? "winner"}'s average pace (s)`} xLabel="Lap">
      <LinePlot series={series} yZero xTicks={lapTicks(Math.min(...laps), Math.max(...laps))} height={280} />
    </ChartPanel>
  );
}

/* LapTimes: one dot per lap. One driver: dots take the tyre colour. Several: the team colour.
   Pit laps and slow laps (over 107% of the driver's median, such as safety cars) are hidden. */

export function LapTimes({
  rows,
  stints = [],
  title,
}: {
  /** Lap times: { lap, LEC: 107.2, LEC_note: "pit in" }. */
  rows: Row[];
  /** The driver's stints, for tyre colours: { code, compound, lapStart, lapEnd }. */
  stints?: { code: string; compound: string | null; lapStart: number | null; lapEnd: number | null }[];
  title?: string;
}) {
  const codes = codesIn(rows, ["lap"]);
  const colours = driverColours(codes);
  const byTyre = codes.length === 1;
  let hidden = 0;
  const dots = codes.flatMap((code) => {
    const times = rows.map((r) => num(r[code])).filter((v): v is number => v != null).sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)] ?? 0;
    return rows.flatMap((r) => {
      const t = num(r[code]);
      if (t == null) return [];
      if (r[`${code}_note`] || Number(r.lap) === 1 || t > median * 1.07) {
        hidden++;
        return [];
      }
      const lap = Number(r.lap);
      const compound = stints.find((s) => s.code === code && (s.lapStart ?? 0) <= lap && lap <= (s.lapEnd ?? Infinity))?.compound;
      return [{ code, lap, t, colour: byTyre ? tyre(compound).colour : colours.get(code)!, compound }];
    });
  });
  const laps = rows.map((r) => Number(r.lap));
  const ts = dots.map((d) => d.t);
  const yTicks = niceTicks(Math.min(...ts), Math.max(...ts), 5);
  const compounds = [...new Set(dots.map((d) => (d.compound ?? "").toUpperCase()))].filter((c) => TYRES[c]);
  const legend = byTyre
    ? compounds.map((c) => <LegendItem key={c} colour={TYRES[c].colour} label={TYRES[c].label} shape="dot" />)
    : codes.map((c) => <LegendItem key={c} colour={colours.get(c)!} label={c} shape="dot" />);
  const height = 260;
  const M = { top: 10, right: 12, bottom: 26, left: 58 };
  return (
    <ChartPanel
      title={title}
      yLabel="Lap time"
      xLabel="Lap"
      legend={legend}
      note={hidden ? `${hidden} pit, opening and slow laps hidden` : undefined}
    >
      <Plot height={height}>
        {(width) => {
          const sx = linear(Math.min(...laps), Math.max(...laps), M.left, width - M.right);
          const y0 = Math.min(yTicks[0], ...ts);
          const y1 = Math.max(yTicks.at(-1)!, ...ts);
          const sy = linear(y0, y1, height - M.bottom, M.top);
          return (
            <>
              {yTicks.map((t) => (
                <g key={t}>
                  <line className="f1s-grid" x1={M.left} x2={width - M.right} y1={sy(t)} y2={sy(t)} />
                  <text className="f1s-tick" x={M.left - 8} y={sy(t)} dy="0.35em" textAnchor="end">
                    {lapTime(t)}
                  </text>
                </g>
              ))}
              <line className="f1s-baseline" x1={M.left} x2={width - M.right} y1={height - M.bottom} y2={height - M.bottom} />
              {lapTicks(Math.min(...laps), Math.max(...laps)).map((t) => (
                <text key={t} className="f1s-tick" x={sx(t)} y={height - 6} textAnchor="middle">
                  {t}
                </text>
              ))}
              {dots.map((d) => (
                <circle key={`${d.code}-${d.lap}`} cx={sx(d.lap)} cy={sy(d.t)} r={3.5} fill={d.colour} />
              ))}
            </>
          );
        }}
      </Plot>
    </ChartPanel>
  );
}

/* RankedBars: one measure across drivers, longest first, in team colours. */

export function RankedBars({
  rows,
  title,
  format = "number",
  unit,
}: {
  rows: { code: string; value: number }[];
  title?: string;
  /** "gap" shows +0.837, "time" shows 1:43.363, "number" shows the value. */
  format?: "gap" | "time" | "number";
  unit?: string;
}) {
  const colours = driverColours(rows.map((r) => r.code));
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  const show = (v: number) => (format === "gap" ? `+${v.toFixed(3)}` : format === "time" ? lapTime(v, 3) : String(v));
  return (
    <ChartPanel title={title}>
      <div className="f1s-ranked">
        {rows.map((r) => (
          <div key={r.code} className="f1s-ranked-row">
            <span className="f1s-code">{r.code}</span>
            <span className="f1s-ranked-track">
              <i style={{ width: `${(r.value / max) * 100}%`, background: colours.get(r.code) }} />
              <b>
                {show(r.value)}
                {unit && <small> {unit}</small>}
              </b>
            </span>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}

/* HeadToHeadBars: two drivers across several measures. Bars meet in the middle; the winner of
   each measure has the bold figure. */

export function HeadToHeadBars({
  drivers,
  measures,
  title,
}: {
  drivers: [string, string];
  measures: { label: string; values: [number, number]; better?: "higher" | "lower" }[];
  title?: string;
}) {
  const colours = driverColours(drivers);
  return (
    <ChartPanel title={title}>
      <div className="f1s-h2h">
        <div className="f1s-h2h-head">
          {drivers.map((code, i) => {
            const d = findDriver(code);
            return (
              <span key={code} className={i ? "f1s-h2h-driver f1s-h2h-right" : "f1s-h2h-driver"}>
                {d && <DriverAvatar number={d.number} size={36} />}
                <span>
                  <b>{code}</b>
                  <small>{d?.lastName}</small>
                </span>
              </span>
            );
          })}
        </div>
        {measures.map((m) => {
          const max = Math.max(...m.values) || 1;
          const [a, b] = m.values;
          const winner = a === b ? -1 : (m.better === "lower" ? a < b : a > b) ? 0 : 1;
          return (
            <div key={m.label} className="f1s-h2h-row">
              <div className="f1s-h2h-label">
                {m.label}
                {m.better === "lower" && <small> · lower is better</small>}
              </div>
              {m.values.map((v, i) => (
                <div key={i} className={`f1s-h2h-side ${i ? "f1s-h2h-b" : "f1s-h2h-a"}`}>
                  <span className={winner === i ? "f1s-h2h-value f1s-win" : "f1s-h2h-value"}>{v}</span>
                  <span className="f1s-h2h-track">
                    <i style={{ width: `${(v / max) * 100}%`, background: colours.get(drivers[i]) }} />
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ChartPanel>
  );
}

/* StintBar: each driver's tyre strategy on a lap axis. Segments take the compound colour and
   show the compound initial and stint length where they fit. */

export function StintBar({
  rows,
  title,
}: {
  /** Stints in driver order: { code, compound, lapStart, lapEnd, laps }. */
  rows: { code: string; compound: string | null; lapStart: number | null; lapEnd: number | null; laps?: number | null }[];
  title?: string;
}) {
  const codes = [...new Set(rows.map((r) => r.code))];
  const last = Math.max(...rows.map((r) => r.lapEnd ?? 0));
  const compounds = [...new Set(rows.map((r) => (r.compound ?? "").toUpperCase()))].filter((c) => TYRES[c]);
  const ROW = 22;
  const GAP = 6;
  const M = { top: 2, right: 8, bottom: 26, left: 44 };
  const height = M.top + codes.length * (ROW + GAP) - GAP + M.bottom;
  return (
    <ChartPanel
      title={title}
      xLabel="Lap"
      legend={compounds.map((c) => <LegendItem key={c} colour={TYRES[c].colour} label={TYRES[c].label} shape="block" />)}
    >
      <Plot height={height}>
        {(width) => {
          const sx = linear(0, last, M.left, width - M.right);
          return (
            <>
              {lapTicks(1, last).map((t) => (
                <g key={t}>
                  <line className="f1s-grid" x1={sx(t)} x2={sx(t)} y1={M.top} y2={height - M.bottom} />
                  <text className="f1s-tick" x={sx(t)} y={height - 6} textAnchor="middle">
                    {t}
                  </text>
                </g>
              ))}
              {codes.map((code, i) => {
                const y = M.top + i * (ROW + GAP);
                return (
                  <g key={code}>
                    <text className="f1s-row-label" x={0} y={y + ROW / 2} dy="0.35em">
                      {code}
                    </text>
                    {rows
                      .filter((r) => r.code === code && r.lapStart != null && r.lapEnd != null)
                      .map((r) => {
                        const x = sx(r.lapStart! - 1) + 1;
                        const w = Math.max(sx(r.lapEnd!) - sx(r.lapStart! - 1) - 2, 1);
                        const t = tyre(r.compound);
                        const n = r.laps ?? r.lapEnd! - r.lapStart! + 1;
                        return (
                          <g key={r.lapStart}>
                            <rect x={x} y={y} width={w} height={ROW} rx={3} fill={t.colour} />
                            {w > 30 && (
                              <text className="f1s-segment" x={x + 7} y={y + ROW / 2} dy="0.35em" fill={t.ink}>
                                {t.label[0]} {n}
                              </text>
                            )}
                          </g>
                        );
                      })}
                  </g>
                );
              })}
            </>
          );
        }}
      </Plot>
    </ChartPanel>
  );
}

/* ChampionshipProgress: cumulative points by round, or each driver's gap to the leader. */

export function ChampionshipProgress({
  rows,
  title,
  mode = "points",
}: {
  /** One row per round: { round, circuit, ANT: 302, RUS: 236 }. */
  rows: Row[];
  title?: string;
  mode?: "points" | "gap";
}) {
  const codes = codesIn(rows, ["round", "race", "circuit"]);
  const colours = driverColours(codes);
  const rounds = rows.map((r) => Number(r.round));
  const leaderPoints = (r: Row) => Math.max(...codes.map((c) => num(r[c]) ?? 0));
  const series: LineSeries[] = codes.map((code) => {
    const points = rows.map((r): [number, number | null] => {
      const v = num(r[code]);
      return [Number(r.round), v == null ? null : mode === "gap" ? leaderPoints(r) - v : v];
    });
    const last = points.at(-1)?.[1];
    return { code, colour: colours.get(code)!, points, endValue: last == null ? undefined : mode === "gap" ? (last ? `−${last}` : "") : String(last) };
  });
  return (
    <ChartPanel title={title} yLabel={mode === "gap" ? "Points behind leader" : "Points"} xLabel="Round">
      <LinePlot series={series} yReverse={mode === "gap"} yZero={mode === "gap"} xTicks={rounds} height={280} />
    </ChartPanel>
  );
}

/* StatCallout: one big figure with a label and a comparison line. */

export function StatCallout({
  label,
  value,
  unit,
  note,
  driver,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  /** A driver code; shows the code in its team colour beside the label. */
  driver?: string;
}) {
  const d = driver ? findDriver(driver) : undefined;
  return (
    <div className="f1s-stat">
      <div className="f1s-stat-label">
        {d && <i style={{ background: teamColour(d.team) }} />}
        {d && <b>{d.acronym}</b>}
        {label}
      </div>
      <div className="f1s-stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {note && <div className="f1s-stat-note">{note}</div>}
    </div>
  );
}

/* Sparkline: a tiny trend with no axes, ending in a dot. */

export function Sparkline({
  values,
  driver,
  width = 96,
  height = 28,
}: {
  values: number[];
  /** A driver code for the team colour; carbon otherwise. */
  driver?: string;
  width?: number;
  height?: number;
}) {
  const colour = driver ? driverColours([driver]).get(driver)! : CARBON;
  const pad = 4;
  const sx = linear(0, Math.max(values.length - 1, 1), pad, width - pad);
  const sy = linear(Math.min(...values), Math.max(...values), height - pad, pad);
  const d = values.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
  return (
    <svg className="f1s-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {values.length > 0 && <circle cx={sx(values.length - 1)} cy={sy(values.at(-1)!)} r={3} fill={colour} />}
    </svg>
  );
}
