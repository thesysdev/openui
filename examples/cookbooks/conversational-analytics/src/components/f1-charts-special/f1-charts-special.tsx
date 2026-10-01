"use client";

// F1-specific charts. Each takes rows shaped like the F1 tools' output (driver codes as keys or
// a `code` field) and owns every visual choice: team colours, tyre colours, scales and labels.
// Every chart has a hover tooltip built from the F1 assets, and plays a short reveal once when
// it scrolls into view (none under reduced motion; see f1-charts-special.css).
import { useEffect, useState, type CSSProperties } from "react";
import { CircuitMap, DriverAvatar, TeamChip, teamColour } from "../f1-assets";
import { findCircuit, findDriver } from "../f1-genui";
import {
  CARBON,
  ChartPanel,
  DriverMark,
  LegendItem,
  LinePlot,
  Plot,
  TYRES,
  Tip,
  TipDriver,
  TipHead,
  TyreChip,
  codesIn,
  driverColours,
  lapTicks,
  lapTime,
  linear,
  niceTicks,
  tyre,
  useReveal,
  type LineSeries,
} from "./chart-kit";

type Row = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const delay = (i: number) => ({ ["--i" as string]: i }) as CSSProperties;
const signed = (v: number, digits: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(digits)}`;

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
      <LinePlot
        series={series}
        yReverse
        yZero
        xTicks={lapTicks(Math.min(...laps), Math.max(...laps))}
        tipValue={(y) => (y === 0 ? "Leader" : `+${y.toFixed(3)}s`)}
      />
    </ChartPanel>
  );
}

/* RaceTrace: each car's running time against the winner's average pace. Above zero is ahead of
   that pace; pit stops and safety cars show as drops and bunching. */

export function RaceTrace({ rows, title }: { /** Lap times: { lap, RUS: 107.4, LEC: 108.1 }. */ rows: Row[]; title?: string }) {
  const codes = codesIn(rows, ["lap"]);
  const colours = driverColours(codes);
  const sorted = [...rows].sort((a, b) => Number(a.lap) - Number(b.lap));
  // Running time per car. A missing lap (a retirement or an OpenF1 gap) ends that car's line,
  // since summing past it would shift every later point.
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
  const pitLaps = (code: string) => sorted.filter((r) => r[`${code}_note`] === "pit in").map((r) => Number(r.lap));
  const series: LineSeries[] = codes.map((code) => ({
    code,
    colour: colours.get(code)!,
    points: totals.get(code)!.map(([lap, t], i) => [lap, t == null ? null : Math.round((refCum[i] - t) * 1000) / 1000]),
    marks: pitLaps(code),
  }));
  const laps = sorted.map((r) => Number(r.lap));
  return (
    <ChartPanel title={title} yLabel={`Vs ${ref ?? "winner"}'s average pace (s)`} xLabel="Lap">
      <LinePlot
        series={series}
        yZero
        xTicks={lapTicks(Math.min(...laps), Math.max(...laps))}
        height={280}
        tipValue={(y) => `${signed(y, 1)}s`}
      />
    </ChartPanel>
  );
}

type StintRow = {
  code: string;
  compound: string | null;
  lapStart: number | null;
  lapEnd: number | null;
  laps?: number | null;
  tyreAgeAtStart?: number | null;
  stint?: number;
};
const stintAt = (stints: StintRow[], code: string, lap: number) =>
  stints.find((s) => s.code === code && (s.lapStart ?? 0) <= lap && lap <= (s.lapEnd ?? Infinity));

/* LapTimes: one dot per lap. One driver: dots take the tyre colour. Several: the team colour.
   Pit laps and slow laps (over 107% of the driver's median, such as safety cars) are hidden.
   Hovering a lap lists each driver's time there with their tyre and its age. */

export function LapTimes({
  rows,
  stints = [],
  title,
}: {
  /** Lap times: { lap, LEC: 107.2, LEC_note: "pit in" }. */
  rows: Row[];
  /** Stints, for tyre colours and ages: { code, compound, lapStart, lapEnd, tyreAgeAtStart }. */
  stints?: StintRow[];
  title?: string;
}) {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
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
      const stint = stintAt(stints, code, lap);
      return [{ code, lap, t, colour: byTyre ? tyre(stint?.compound).colour : colours.get(code)!, stint }];
    });
  });
  const laps = rows.map((r) => Number(r.lap));
  const [l0, l1] = [Math.min(...laps), Math.max(...laps)];
  const ts = dots.map((d) => d.t);
  const yTicks = niceTicks(Math.min(...ts), Math.max(...ts), 5);
  const compounds = [...new Set(dots.map((d) => (d.stint?.compound ?? "").toUpperCase()))].filter((c) => TYRES[c]);
  const legend = byTyre
    ? compounds.map((c) => <LegendItem key={c} colour={TYRES[c].colour} label={TYRES[c].label} shape="dot" />)
    : codes.map((c) => <LegendItem key={c} colour={colours.get(c)!} label={c} shape="dot" />);
  const height = 260;
  const M = { top: 10, right: 12, bottom: 26, left: 58 };
  const scales = (width: number) => ({
    sx: linear(l0, l1, M.left, width - M.right),
    sy: linear(Math.min(yTicks[0], ...ts), Math.max(yTicks.at(-1)!, ...ts), height - M.bottom, M.top),
  });
  const hoverLap = (width: number) => {
    if (!pointer || pointer.x < M.left - 8) return null;
    const lap = Math.round(l0 + ((pointer.x - M.left) / (width - M.right - M.left)) * (l1 - l0));
    return dots.some((d) => d.lap === lap) ? lap : null;
  };
  return (
    <ChartPanel title={title} yLabel="Lap time" xLabel="Lap" legend={legend} note={hidden ? `${hidden} pit, opening and slow laps hidden` : undefined}>
      <Plot
        height={height}
        onPointer={setPointer}
        overlay={(width) => {
          const lap = hoverLap(width);
          if (lap == null) return null;
          const { sx } = scales(width);
          const here = dots.filter((d) => d.lap === lap).sort((a, b) => a.t - b.t);
          return (
            <Tip x={sx(lap)} y={pointer!.y}>
              <TipHead>Lap {lap}</TipHead>
              {here.map((d, i) => (
                <TipDriver key={d.code} code={d.code} value={i ? `+${(d.t - here[0].t).toFixed(3)}` : lapTime(d.t, 3)}>
                  {d.stint && (
                    <>
                      <TyreChip compound={d.stint.compound} />
                      {d.stint.tyreAgeAtStart != null && d.stint.lapStart != null && `${d.stint.tyreAgeAtStart + lap - d.stint.lapStart + 1} laps old`}
                    </>
                  )}
                </TipDriver>
              ))}
            </Tip>
          );
        }}
      >
        {(width) => {
          const { sx, sy } = scales(width);
          const lap = hoverLap(width);
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
              {lapTicks(l0, l1).map((t) => (
                <text key={t} className="f1s-tick" x={sx(t)} y={height - 6} textAnchor="middle">
                  {t}
                </text>
              ))}
              {lap != null && <line className="f1s-crosshair" x1={sx(lap)} x2={sx(lap)} y1={M.top} y2={height - M.bottom} />}
              {dots.map((d) => (
                <circle
                  key={`${d.code}-${d.lap}`}
                  className={d.lap === lap ? "f1s-dot f1s-hover-dot" : "f1s-dot"}
                  style={delay(d.lap - l0)}
                  cx={sx(d.lap)}
                  cy={sy(d.t)}
                  r={d.lap === lap ? 5 : 3.5}
                  fill={d.colour}
                />
              ))}
            </>
          );
        }}
      </Plot>
    </ChartPanel>
  );
}

/* RankedBars: one measure across drivers, in the given order, in team colours. Each row starts
   with the driver's number disc; hovering a row shows the driver's headshot, team and value. */

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
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const colours = driverColours(rows.map((r) => r.code));
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  const show = (v: number) => (format === "gap" ? `+${v.toFixed(3)}` : format === "time" ? lapTime(v, 3) : String(v));
  const h = hover && rows[hover.i];
  const d = h ? findDriver(h.code) : undefined;
  return (
    <ChartPanel title={title}>
      <div className="f1s-ranked" onPointerLeave={() => setHover(null)}>
        {rows.map((r, i) => (
          <div
            key={r.code}
            className={hover?.i === i ? "f1s-ranked-row f1s-hovered" : "f1s-ranked-row"}
            onPointerMove={(e) => {
              const box = e.currentTarget.parentElement!.getBoundingClientRect();
              setHover({ i, x: e.clientX - box.left, y: e.clientY - box.top });
            }}
          >
            <DriverMark code={r.code} />
            <span className="f1s-ranked-track">
              <i className="f1s-bar" style={{ width: `${(r.value / max) * 100}%`, background: colours.get(r.code), ...delay(i) }} />
              <b>
                {show(r.value)}
                {unit && <small> {unit}</small>}
              </b>
            </span>
          </div>
        ))}
        {hover && h && (
          <Tip x={hover.x} y={hover.y}>
            <TipHead>{d?.fullName ?? h.code}</TipHead>
            <TipDriver code={h.code} value={`${show(h.value)}${unit ? ` ${unit}` : ""}`}>
              {d && <TeamChip team={d.team} size={12} />}
            </TipDriver>
            {hover.i > 0 && (
              <div className="f1s-tip-foot">
                {signed(h.value - rows[hover.i - 1].value, format === "number" ? 0 : 3)} to {rows[hover.i - 1].code}
              </div>
            )}
          </Tip>
        )}
      </div>
    </ChartPanel>
  );
}

/* HeadToHeadBars: two drivers across several measures. Bars meet in the middle; the winner of
   each measure has the bold figure. Hovering a measure says who won it and by how much. */

export function HeadToHeadBars({
  drivers,
  measures,
  title,
}: {
  drivers: [string, string];
  measures: { label: string; values: [number, number]; better?: "higher" | "lower" }[];
  title?: string;
}) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const colours = driverColours(drivers);
  const winnerOf = (m: (typeof measures)[number]) => {
    const [a, b] = m.values;
    return a === b ? -1 : (m.better === "lower" ? a < b : a > b) ? 0 : 1;
  };
  const hm = hover && measures[hover.i];
  return (
    <ChartPanel title={title}>
      <div className="f1s-h2h" onPointerLeave={() => setHover(null)}>
        <div className="f1s-h2h-head">
          {drivers.map((code, i) => {
            const d = findDriver(code);
            return (
              <span key={code} className={i ? "f1s-h2h-driver f1s-h2h-right" : "f1s-h2h-driver"}>
                {d && <DriverAvatar number={d.number} size={40} showHeadshot />}
                <span>
                  <b>{code}</b>
                  <small>{d?.lastName}</small>
                </span>
              </span>
            );
          })}
        </div>
        {measures.map((m, mi) => {
          const max = Math.max(...m.values) || 1;
          const winner = winnerOf(m);
          return (
            <div
              key={m.label}
              className={hover?.i === mi ? "f1s-h2h-row f1s-hovered" : "f1s-h2h-row"}
              onPointerMove={(e) => {
                const box = e.currentTarget.parentElement!.getBoundingClientRect();
                setHover({ i: mi, x: e.clientX - box.left, y: e.clientY - box.top });
              }}
            >
              <div className="f1s-h2h-label">
                {m.label}
                {m.better === "lower" && <small> · lower is better</small>}
              </div>
              {m.values.map((v, i) => (
                <div key={i} className={`f1s-h2h-side ${i ? "f1s-h2h-b" : "f1s-h2h-a"}`}>
                  <span className={winner === i ? "f1s-h2h-value f1s-win" : "f1s-h2h-value"}>{v}</span>
                  <span className="f1s-h2h-track">
                    <i className="f1s-bar" style={{ width: `${(v / max) * 100}%`, background: colours.get(drivers[i]), ...delay(mi) }} />
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        {hover && hm && (
          <Tip x={hover.x} y={hover.y}>
            <TipHead>{hm.label}</TipHead>
            {drivers.map((code, i) => (
              <TipDriver key={code} code={code} value={hm.values[i]} />
            ))}
            <div className="f1s-tip-foot">
              {winnerOf(hm) < 0 ? "Level" : `${drivers[winnerOf(hm) as 0 | 1]} by ${Math.round(Math.abs(hm.values[0] - hm.values[1]) * 10) / 10}`}
            </div>
          </Tip>
        )}
      </div>
    </ChartPanel>
  );
}

/* StintBar: each driver's tyre strategy on a lap axis. Rows start with the driver's number disc;
   segments take the compound colour with a tyre chip and the stint length. Hovering a stint
   shows its laps and whether the tyres were new. On reveal the stints wipe in lap by lap. */

export function StintBar({ rows, title }: { /** Stints in driver order. */ rows: StintRow[]; title?: string }) {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const codes = [...new Set(rows.map((r) => r.code))];
  const last = Math.max(...rows.map((r) => r.lapEnd ?? 0));
  const compounds = [...new Set(rows.map((r) => (r.compound ?? "").toUpperCase()))].filter((c) => TYRES[c]);
  const ROW = 22;
  const GAP = 6;
  const M = { top: 2, right: 8, bottom: 26, left: 66 };
  const height = M.top + codes.length * (ROW + GAP) - GAP + M.bottom;
  const valid = rows.filter((r) => r.lapStart != null && r.lapEnd != null);
  const sxFor = (width: number) => linear(0, last, M.left, width - M.right);
  const rowY = (code: string) => M.top + codes.indexOf(code) * (ROW + GAP);
  const hovered = (width: number) => {
    if (!pointer || pointer.x < M.left) return null;
    const code = codes[Math.floor((pointer.y - M.top) / (ROW + GAP))];
    const lap = ((pointer.x - M.left) / (width - M.right - M.left)) * last + 1;
    return valid.find((r) => r.code === code && r.lapStart! <= lap && lap < r.lapEnd! + 1) ?? null;
  };
  return (
    <ChartPanel
      title={title}
      xLabel="Lap"
      legend={compounds.map((c) => <LegendItem key={c} colour={TYRES[c].colour} label={TYRES[c].label} shape="block" />)}
    >
      <Plot
        height={height}
        onPointer={setPointer}
        overlay={(width) => {
          const stint = hovered(width);
          const age = stint?.tyreAgeAtStart ?? 0;
          return (
            <>
              {codes.map((code, i) => (
                <DriverMark key={code} code={code} style={{ left: 0, top: rowY(code) + ROW / 2, ...delay(i) }} />
              ))}
              {stint && (
                <Tip x={sxFor(width)(stint.lapEnd!)} y={rowY(stint.code) + ROW / 2}>
                  <TipHead>Stint {stint.stint ?? ""}</TipHead>
                  <TipDriver code={stint.code} value={`${stint.lapEnd! - stint.lapStart! + 1} laps`}>
                    <TyreChip compound={stint.compound} />
                    {tyre(stint.compound).label}
                  </TipDriver>
                  <div className="f1s-tip-foot">
                    Laps {stint.lapStart}–{stint.lapEnd} · {age ? `used, ${age} laps old` : "new set"}
                  </div>
                </Tip>
              )}
            </>
          );
        }}
      >
        {(width) => {
          const sx = sxFor(width);
          const active = hovered(width);
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
              {valid.map((r) => {
                const y = rowY(r.code);
                const x = sx(r.lapStart! - 1) + 1;
                const w = Math.max(sx(r.lapEnd!) - sx(r.lapStart! - 1) - 2, 1);
                const t = tyre(r.compound);
                const n = r.laps ?? r.lapEnd! - r.lapStart! + 1;
                const cls = active ? (active === r ? "f1s-stint f1s-active" : "f1s-stint f1s-dimmed") : "f1s-stint";
                return (
                  <g
                    key={`${r.code}-${r.lapStart}`}
                    className={cls}
                    style={{ ["--start" as string]: (r.lapStart! - 1) / last, ["--len" as string]: n / last, ...delay(codes.indexOf(r.code)) }}
                  >
                    <rect className="f1s-stint-bar" x={x} y={y} width={w} height={ROW} rx={3} fill={t.colour} />
                    {w > 36 && (
                      <g className="f1s-stint-label">
                        <circle cx={x + 11} cy={y + ROW / 2} r={7.5} fill={t.ink} fillOpacity={0.18} />
                        <text className="f1s-segment" x={x + 11} y={y + ROW / 2} dy="0.35em" textAnchor="middle" fill={t.ink}>
                          {t.label[0]}
                        </text>
                        <text className="f1s-segment" x={x + 23} y={y + ROW / 2} dy="0.35em" fill={t.ink}>
                          {n}
                        </text>
                      </g>
                    )}
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

/* ChampionshipProgress: cumulative points by round, or each driver's gap to the leader.
   Hovering a round shows its circuit and everyone's points there. */

export function ChampionshipProgress({
  rows,
  title,
  mode = "points",
}: {
  /** One row per round: { round, circuit, race, ANT: 302, RUS: 236 }. */
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
  const roundRow = (x: number) => rows.find((r) => Number(r.round) === x);
  return (
    <ChartPanel title={title} yLabel={mode === "gap" ? "Points behind leader" : "Points"} xLabel="Round">
      <LinePlot
        series={series}
        yReverse={mode === "gap"}
        yZero={mode === "gap"}
        xTicks={rounds}
        height={280}
        tipTitle={(x) => (
          <>
            <small>Round {x}</small>
            {String(roundRow(x)?.circuit ?? roundRow(x)?.race ?? "")}
          </>
        )}
        tipAside={(x) => {
          const c = findCircuit(String(roundRow(x)?.circuit ?? ""));
          return c ? <CircuitMap id={c.id} size={30} colour="#FFFFFF" strokeWidth={56} /> : null;
        }}
        tipValue={(y) => (mode === "gap" ? (y ? `−${y}` : "Leader") : `${y} pts`)}
      />
    </ChartPanel>
  );
}

/* StatCallout: one big figure with a label and a comparison line. A plain number counts up once
   when it comes into view; the final figure holds the width, so nothing shifts. */

function useCountUp(value: string, run: boolean) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const m = value.match(/^([+−-]?)(\d+(?:\.(\d+))?)$/);
    if (!m || !run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const target = Number(m[2]);
    const digits = m[3]?.length ?? 0;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / 700, 1);
      setShown(`${m[1]}${(target * (1 - (1 - t) ** 3)).toFixed(digits)}`);
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, run]);
  return shown;
}

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
  /** A driver code; shows the driver's number disc and code beside the label. */
  driver?: string;
}) {
  const [ref, reveal] = useReveal<HTMLDivElement>();
  const shown = useCountUp(value, reveal.endsWith("in"));
  const d = driver ? findDriver(driver) : undefined;
  return (
    <div ref={ref} className={`f1s-stat ${reveal}`}>
      <div className="f1s-stat-label">
        {d && <DriverAvatar number={d.number} size={18} />}
        {d && <b>{d.acronym}</b>}
        {label}
      </div>
      <div className="f1s-stat-value">
        <span className="f1s-stat-figure">
          <span aria-hidden="true">{value}</span>
          <span>{shown}</span>
        </span>
        {unit && <small>{unit}</small>}
      </div>
      {note && <div className="f1s-stat-note">{note}</div>}
    </div>
  );
}

/* Sparkline: a tiny trend with no axes, ending in a dot. Hovering moves the dot and shows the
   value there. */

export function Sparkline({
  values,
  labels,
  driver,
  width = 96,
  height = 28,
  format = String,
}: {
  values: number[];
  /** A name per value for the tooltip, e.g. circuits. */
  labels?: string[];
  /** A driver code for the team colour; carbon otherwise. */
  driver?: string;
  width?: number;
  height?: number;
  format?: (v: number) => string;
}) {
  const [ref, reveal] = useReveal<HTMLSpanElement>();
  const [hover, setHover] = useState<number | null>(null);
  const d = driver ? findDriver(driver) : undefined;
  const colour = d ? teamColour(d.team) : CARBON;
  const pad = 4;
  const sx = linear(0, Math.max(values.length - 1, 1), pad, width - pad);
  const sy = linear(Math.min(...values), Math.max(...values), height - pad, pad);
  const path = values.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
  const i = hover ?? values.length - 1;
  return (
    <span
      ref={ref}
      className={`f1s-spark-wrap ${reveal}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const at = Math.round(((e.clientX - r.left - pad) / (width - pad * 2)) * (values.length - 1));
        setHover(Math.max(0, Math.min(values.length - 1, at)));
      }}
      onPointerLeave={() => setHover(null)}
    >
      <svg className="f1s-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path className="f1s-line f1s-spark-line" pathLength={1} d={path} stroke={colour} />
        {values.length > 0 && <circle className="f1s-spark-dot" cx={sx(i)} cy={sy(values[i])} r={3} fill={colour} />}
      </svg>
      {hover != null && (
        <span className="f1s-spark-tip" style={{ left: sx(hover) }}>
          {labels?.[hover] && <small>{labels[hover]}</small>}
          {format(values[hover])}
        </span>
      )}
    </span>
  );
}
