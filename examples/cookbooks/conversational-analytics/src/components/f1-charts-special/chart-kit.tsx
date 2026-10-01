"use client";

// Shared pieces for the F1 charts: driver colours, scales and ticks, and the titled panel with
// axes. The panel and title reuse the look from f1-charts.css (tinted panel, Saira title), so
// these charts sit next to LineChart and BarChart without a seam. Also the hover tooltip, the
// driver and tyre marks used inside charts, and the one-time reveal when a chart scrolls into view.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { findDriver, findTeam } from "../f1-genui";
import { DriverAvatar, teamColour } from "../f1-assets";
import { TeamLogo } from "../f1-team-logos";
import "../f1-charts.css";
import "./f1-charts-special.css";

export const CARBON = "#15151E";
export const F1_RED = "#E10600";

/** Mix toward white, so a second car from the same team reads as its teammate. */
export function lighten(hex: string, amount: number) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${c.map((v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

/** Team colour per driver code, in order; a teammate after the first takes the lighter shade. */
export function driverColours(codes: string[]) {
  const used = new Map<string, number>();
  return new Map(
    codes.map((code) => {
      const team = findDriver(code)?.team;
      if (!team) return [code, CARBON];
      const n = used.get(team) ?? 0;
      used.set(team, n + 1);
      return [code, n ? lighten(teamColour(team), 0.45) : teamColour(team)];
    }),
  );
}

/** Driver codes among a row's keys, in first-seen order: { lap: 1, RUS: 0, LEC: 1.7 } → RUS, LEC. */
export function codesIn(rows: Record<string, unknown>[], skip: string[]) {
  const codes: string[] = [];
  for (const row of rows)
    for (const key of Object.keys(row))
      if (!skip.includes(key) && /^[A-Z]{3}$/.test(key) && !codes.includes(key)) codes.push(key);
  return codes;
}

export const TYRES: Record<string, { label: string; colour: string; ink: string }> = {
  SOFT: { label: "Soft", colour: "#DA291C", ink: "#FFFFFF" },
  MEDIUM: { label: "Medium", colour: "#FFD12E", ink: CARBON },
  HARD: { label: "Hard", colour: "#CFCDC9", ink: CARBON },
  INTERMEDIATE: { label: "Inter", colour: "#43B02A", ink: "#FFFFFF" },
  WET: { label: "Wet", colour: "#0067AD", ink: "#FFFFFF" },
};
export const tyre = (compound: string | null | undefined) =>
  TYRES[(compound ?? "").toUpperCase()] ?? { label: "Unknown", colour: "#949498", ink: "#FFFFFF" };

export const linear = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

/** Round tick values covering [min, max], about `count` of them. */
export function niceTicks(min: number, max: number, count = 5) {
  if (!(max > min)) return [min];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** Lap ticks: 1 plus round tens (or fives on short ranges) up to the last lap. */
export function lapTicks(first: number, last: number) {
  const step = last - first > 30 ? 10 : 5;
  const ticks = [first];
  for (let v = Math.ceil((first + 1) / step) * step; v <= last; v += step) if (v - ticks.at(-1)! >= step / 2) ticks.push(v);
  return ticks;
}

/** 107.4 → "1:47.4"; under a minute stays in seconds. */
export function lapTime(seconds: number, digits = 1) {
  if (seconds < 60) return seconds.toFixed(digits);
  const m = Math.floor(seconds / 60);
  return `${m}:${(seconds - m * 60).toFixed(digits).padStart(digits ? digits + 3 : 2, "0")}`;
}

/** The element's content width, measured before paint, so a fixed-height plot never shifts. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** "pending" until the element is a quarter in view, then "in" for good. The CSS plays the reveal
    on "in" (and only without reduced motion), so a chart animates once and then stays still. */
export function useReveal<T extends Element>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<"pending" | "in">("pending");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, `f1s-reveal f1s-${state}`] as const;
}

/** The tinted panel: title, a vertical y-axis label beside the plot, the x-axis label and a legend under it. */
export function ChartPanel({
  title,
  yLabel,
  xLabel,
  legend,
  note,
  children,
}: {
  title?: string;
  yLabel?: string;
  xLabel?: string;
  legend?: ReactNode;
  note?: string;
  children: ReactNode;
}) {
  const [ref, reveal] = useReveal<HTMLElement>();
  return (
    <figure ref={ref} className={`f1-chart f1s-chart ${reveal}`}>
      {title && <figcaption className="f1-chart-title">{title}</figcaption>}
      <div className={yLabel ? "f1s-body f1s-has-y" : "f1s-body"}>
        {yLabel && <div className="f1s-axis-label f1s-y-label">{yLabel}</div>}
        <div className="f1s-main">
          {children}
          {xLabel && <div className="f1s-axis-label f1s-x-label">{xLabel}</div>}
          {legend && <div className="f1s-legend">{legend}</div>}
          {note && <div className="f1s-note">{note}</div>}
        </div>
      </div>
    </figure>
  );
}

/** A plot of fixed height that fills the panel's width; draws once the width is known. `overlay`
    is HTML laid over the SVG (labels with avatars, the tooltip). The pointer position is reported
    in plot pixels, or null when it leaves. */
export function Plot({
  height,
  children,
  overlay,
  onPointer,
}: {
  height: number;
  children: (width: number) => ReactNode;
  overlay?: (width: number) => ReactNode;
  onPointer?: (point: { x: number; y: number } | null) => void;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const move = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    onPointer?.({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  return (
    <div
      ref={ref}
      className="f1s-plot"
      style={{ height }}
      onPointerMove={onPointer && move}
      onPointerDown={onPointer && move}
      onPointerLeave={onPointer && (() => onPointer(null))}
    >
      {width > 0 && (
        <>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
            {children(width)}
          </svg>
          {overlay?.(width)}
        </>
      )}
    </div>
  );
}

/** The hover tooltip: a flat carbon tag beside the point, flipped and clamped to stay inside its
    positioned parent. Never transitions. */
export function Tip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;
    const [w, h, W, H] = [el.offsetWidth, el.offsetHeight, parent.clientWidth, parent.clientHeight];
    let left = x + 16;
    if (left + w > W) left = x - 16 - w;
    left = Math.max(0, Math.min(left, W - w));
    const top = Math.max(0, Math.min(y - h / 2, H - h));
    setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
  });
  return (
    <div ref={ref} className="f1s-tip" style={{ left: pos?.left ?? x, top: pos?.top ?? y, visibility: pos ? "visible" : "hidden" }}>
      {children}
    </div>
  );
}

export function TipHead({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="f1s-tip-head">
      {aside}
      <span>{children}</span>
    </div>
  );
}

/** One driver in a tooltip: headshot, code, an optional detail (tyre, pit) and the value. A team
    name instead of a code ("Ferrari") shows the team's logo on its colour. */
export function TipDriver({ code, value, children }: { code: string; value?: ReactNode; children?: ReactNode }) {
  const d = findDriver(code);
  const team = d ? undefined : findTeam(code);
  return (
    <div className="f1s-tip-row">
      {d ? (
        <DriverAvatar number={d.number} size={26} showHeadshot />
      ) : team ? (
        <span className="f1s-tip-dot" style={{ display: "grid", placeItems: "center", background: teamColour(team) }}>
          <TeamLogo team={team} size={16} variant="white" />
        </span>
      ) : (
        <span className="f1s-tip-dot" />
      )}
      <b>{code}</b>
      {children && <span className="f1s-tip-detail">{children}</span>}
      {value != null && <span className="f1s-tip-value">{value}</span>}
    </div>
  );
}

/** A tyre compound chip: the compound colour with its initial, like the timing screens. */
export function TyreChip({ compound, size = 16 }: { compound: string | null | undefined; size?: number }) {
  const t = tyre(compound);
  return (
    <span className="f1s-tyre" style={{ width: size, height: size, fontSize: size * 0.62, background: t.colour, color: t.ink }} title={t.label}>
      {t.label[0]}
    </span>
  );
}

/** A driver at the end of a line or the start of a row: number disc in team colour and code.
    A team name instead of a code shows the team's logo. */
export function DriverMark({ code, value, style }: { code: string; value?: string; style?: CSSProperties }) {
  const d = findDriver(code);
  const team = d ? undefined : findTeam(code);
  return (
    <span className="f1s-driver-mark" style={style}>
      {d ? <DriverAvatar number={d.number} size={20} /> : team && <TeamLogo team={team} size={18} />}
      <b>{code}</b>
      {value && <small>{value}</small>}
    </span>
  );
}

export function LegendItem({ colour, label, shape = "line" }: { colour: string; label: string; shape?: "line" | "dot" | "block" }) {
  return (
    <span className="f1s-legend-item">
      <i className={`f1s-swatch f1s-swatch-${shape}`} style={{ background: colour }} />
      {label}
    </span>
  );
}

/** Spread labels apart vertically so none sit closer than `gap`, keeping them near their targets. */
export function spread<T extends { y: number }>(items: T[], gap: number, min: number, max: number) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + gap);
  const overflow = sorted.length ? sorted[sorted.length - 1].y - max : 0;
  if (overflow > 0) for (const s of sorted) s.y -= overflow;
  for (let i = sorted.length - 2; i >= 0; i--) sorted[i].y = Math.min(sorted[i].y, sorted[i + 1].y - gap);
  for (const s of sorted) s.y = Math.max(s.y, min);
  return sorted;
}

export type LineSeries = {
  code: string;
  colour: string;
  /** [x, y] per point; null y breaks the line. */
  points: [number, number | null][];
  /** Text after the code in the end label, e.g. "302". */
  endValue?: string;
  /** x values to mark with a dot, e.g. pit laps. */
  marks?: number[];
};

/** Lines over a numeric x axis, labelled at their ends by driver (avatar and code) instead of a
    legend. Hovering snaps a crosshair to the nearest x and lists every car there. */
export function LinePlot({
  series,
  height = 260,
  xTicks,
  xFormat = String,
  yFormat = String,
  yReverse = false,
  yZero = false,
  yDomain,
  tipTitle = (x) => `Lap ${x}`,
  tipAside,
  tipValue = (y) => yFormat(y),
  markLabel = "Pit",
}: {
  series: LineSeries[];
  height?: number;
  xTicks?: number[];
  xFormat?: (x: number) => string;
  yFormat?: (y: number) => string;
  yReverse?: boolean;
  /** Draw a dashed rule at y = 0 (the reference line). */
  yZero?: boolean;
  yDomain?: [number, number];
  tipTitle?: (x: number) => ReactNode;
  /** An asset beside the tooltip title, e.g. the circuit for a round. */
  tipAside?: (x: number) => ReactNode;
  tipValue?: (y: number, code: string) => ReactNode;
  /** What a mark means in the tooltip, e.g. "Pit". */
  markLabel?: string;
}) {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const ys = series.flatMap((s) => s.points.map((p) => p[1]).filter((y): y is number => y != null));
  const x0 = xs[0];
  const x1 = xs.at(-1)!;
  const yTicks = niceTicks(yDomain?.[0] ?? Math.min(...ys, yZero ? 0 : Infinity), yDomain?.[1] ?? Math.max(...ys, yZero ? 0 : -Infinity), 5);
  const y0 = Math.min(yTicks[0], ...ys);
  const y1 = Math.max(yTicks.at(-1)!, ...ys);
  const longest = Math.max(...series.map((s) => s.code.length + (s.endValue ? s.endValue.length + 1 : 0)));
  const M = { top: 10, right: 34 + longest * 8.5, bottom: 26, left: 6 + Math.max(...yTicks.map((t) => yFormat(t).length)) * 8 };
  const scales = (width: number) => ({
    sx: linear(x0, x1, M.left, width - M.right),
    sy: yReverse ? linear(y0, y1, M.top, height - M.bottom) : linear(y0, y1, height - M.bottom, M.top),
  });
  const hoverX = (width: number) => {
    if (!pointer) return null;
    const { sx } = scales(width);
    if (pointer.x < M.left - 8 || pointer.x > width - M.right + 8) return null;
    return xs.reduce((best, x) => (Math.abs(sx(x) - pointer.x) < Math.abs(sx(best) - pointer.x) ? x : best), xs[0]);
  };
  const at = (s: LineSeries, x: number) => s.points.find((p) => p[0] === x)?.[1] ?? null;

  return (
    <Plot
      height={height}
      onPointer={setPointer}
      overlay={(width) => {
        const { sx, sy } = scales(width);
        const labels = spread(
          series
            .map((s) => {
              const last = [...s.points].reverse().find((p) => p[1] != null);
              return last ? { s, x: sx(last[0]), y: sy(last[1]!) } : null;
            })
            .filter((l): l is { s: LineSeries; x: number; y: number } => !!l),
          22,
          M.top + 2,
          height - M.bottom,
        );
        const hx = hoverX(width);
        const rows =
          hx == null
            ? []
            : series
                .map((s) => ({ s, y: at(s, hx) }))
                .filter((r): r is { s: LineSeries; y: number } => r.y != null)
                .sort((a, b) => (yReverse ? a.y - b.y : b.y - a.y));
        return (
          <>
            {labels.map(({ s, x, y }, i) => (
              <DriverMark key={s.code} code={s.code} value={s.endValue} style={{ left: x + 8, top: y, ["--i" as string]: i }} />
            ))}
            {hx != null && rows.length > 0 && (
              <Tip x={sx(hx)} y={pointer!.y}>
                <TipHead aside={tipAside?.(hx)}>{tipTitle(hx)}</TipHead>
                {rows.map(({ s, y }) => (
                  <TipDriver key={s.code} code={s.code} value={tipValue(y, s.code)}>
                    {s.marks?.includes(hx) && <span className="f1s-tip-tag">{markLabel}</span>}
                  </TipDriver>
                ))}
              </Tip>
            )}
          </>
        );
      }}
    >
      {(width) => {
        const { sx, sy } = scales(width);
        const baseline = height - M.bottom;
        const hx = hoverX(width);
        return (
          <>
            {yTicks.map((t) => (
              <g key={t}>
                <line className="f1s-grid" x1={M.left} x2={width - M.right} y1={sy(t)} y2={sy(t)} />
                <text className="f1s-tick" x={M.left - 8} y={sy(t)} dy="0.35em" textAnchor="end">
                  {yFormat(t)}
                </text>
              </g>
            ))}
            <line className="f1s-baseline" x1={M.left} x2={width - M.right} y1={baseline} y2={baseline} />
            {yZero && <line className="f1s-zero" x1={M.left} x2={width - M.right} y1={sy(0)} y2={sy(0)} />}
            {(xTicks ?? niceTicks(x0, x1, 6)).map((t) => (
              <text key={t} className="f1s-tick" x={sx(t)} y={height - 6} textAnchor="middle">
                {xFormat(t)}
              </text>
            ))}
            {hx != null && <line className="f1s-crosshair" x1={sx(hx)} x2={sx(hx)} y1={M.top} y2={baseline} />}
            {series.map((s) => (
              <path
                key={s.code}
                className="f1s-line"
                pathLength={1}
                stroke={s.colour}
                d={s.points
                  .map((p, i) => (p[1] == null ? "" : `${i && s.points[i - 1][1] != null ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`))
                  .join("")}
              />
            ))}
            {series.flatMap((s) =>
              (s.marks ?? []).flatMap((m) => {
                const y = at(s, m);
                return y != null ? [<circle key={`${s.code}-${m}`} className="f1s-mark" cx={sx(m)} cy={sy(y)} r={4.5} fill={s.colour} />] : [];
              }),
            )}
            {hx != null &&
              series.flatMap((s) => {
                const y = at(s, hx);
                return y != null ? [<circle key={`h-${s.code}`} className="f1s-hover-dot" cx={sx(hx)} cy={sy(y)} r={5} fill={s.colour} />] : [];
              })}
          </>
        );
      }}
    </Plot>
  );
}
