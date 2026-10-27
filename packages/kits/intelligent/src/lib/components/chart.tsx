"use client";

import { defineComponent } from "@openuidev/react-lang";
import { useId, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { z } from "zod/v4";

type Row = Record<string, unknown>;
type Format = (value: number, compact?: boolean) => string;
type Spec = {
  type: "bar" | "line" | "area" | "pie" | "donut" | "scatter";
  rows: Row[];
  x: string;
  series: string[];
  stacked: boolean;
  height: number;
  format: Format;
};

const COLORS = 6;
const seriesColor = (i: number) => `var(--iui-chart-${(i % COLORS) + 1})`;
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0);
const label = (row: Row, x: string) => String(row[x] ?? "");

function makeFormat(kind: string | undefined, currency: string | undefined): Format {
  const code = typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : "USD";
  // Axis ticks are compact ("$2B"); tooltips keep two decimals ("$1.24B").
  return (value, compact) => {
    if (kind === "percent") return `${Number(value.toFixed(compact ? 1 : 2))}%`;
    const big = Math.abs(value) >= (compact ? 1000 : 1e6);
    const options: Intl.NumberFormatOptions = { minimumFractionDigits: 0, maximumFractionDigits: compact && big ? 1 : 2, ...(big ? { notation: "compact" } : {}) };
    return value.toLocaleString("en-US", kind === "currency" ? { ...options, style: "currency", currency: code } : options);
  };
}

function niceStep(span: number) {
  if (span <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(span));
  const n = span / power;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function Legend({ series }: { series: string[] }) {
  if (series.length < 2) return null;
  return (
    <div className="iui-chart-legend">
      {series.map((s, i) => (
        <span key={s}>
          <i style={{ background: seriesColor(i) }} />
          {s}
        </span>
      ))}
    </div>
  );
}

function Cartesian({ spec, width }: { spec: Spec; width: number }) {
  const gradient = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const { rows, series, type, height, format, x } = spec;
  const stacked = spec.stacked && type !== "line";
  const tops = rows.map((row) => {
    let total = 0;
    return series.map((s) => (total += Math.max(0, num(row[s]))));
  });
  const values = stacked ? tops.map((t) => t[t.length - 1] ?? 0) : rows.flatMap((row) => series.map((s) => num(row[s])));
  const step = niceStep((Math.max(0, ...values) - Math.min(0, ...values)) / 5);
  const lo = Math.floor(Math.min(0, ...values) / step) * step;
  const hi = Math.max(lo + step, Math.ceil(Math.max(0, ...values) / step) * step);
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, k) => lo + k * step);
  const left = Math.max(...ticks.map((t) => format(t, true).length)) * 6.4 + 12;
  const pad = { top: 10, right: 4, bottom: 26, left };
  const w = Math.max(10, width - pad.left - pad.right);
  const h = Math.max(10, height - pad.top - pad.bottom);
  const band = w / Math.max(1, rows.length);
  const xAt = (i: number) => pad.left + band * i + band / 2;
  const y = (v: number) => pad.top + h - ((v - lo) / (hi - lo)) * h;
  // Label every nth category so the labels never overlap.
  const longest = Math.max(1, ...rows.map((r) => label(r, x).length));
  const every = Math.max(1, Math.ceil((longest * 6.6 + 10) / band));
  const shown = (i: number) => i % every === 0;
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const i = Math.floor((event.clientX - box.left - pad.left) / band);
    setHover(i >= 0 && i < rows.length ? i : null);
  };
  const tip = hover === null ? null : rows[hover];
  return (
    <div className="iui-chart-plot" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={`${type} chart of ${series.join(", ")} by ${x}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={s} id={`${gradient}-${si}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={seriesColor(si)} stopOpacity={stacked ? 0.5 : 0.24} />
              <stop offset="100%" stopColor={seriesColor(si)} stopOpacity={stacked ? 0.3 : 0.02} />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} className="iui-chart-grid" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={pad.left - 10} y={y(t) + 4} textAnchor="end" className="iui-chart-tick">
              {format(t, true)}
            </text>
          </g>
        ))}
        {rows.map((row, i) =>
          shown(i) ? (
            <text key={i} x={xAt(i)} y={height - 6} textAnchor="middle" className="iui-chart-category">
              {label(row, x)}
            </text>
          ) : null,
        )}
        {hover !== null && type === "bar" && <rect x={pad.left + band * hover} y={pad.top} width={band} height={h} className="iui-chart-hover" />}
        {type === "bar" &&
          rows.map((row, i) => {
            const inner = Math.min(band * 0.7, 72 * Math.max(1, stacked ? 1 : series.length));
            if (stacked)
              return series.map((s, si) => {
                const top = y(tops[i][si]);
                const base = y(tops[i][si - 1] ?? 0);
                return <rect key={`${i}-${s}`} x={xAt(i) - inner / 2} y={top} width={inner} height={Math.max(0, base - top)} fill={seriesColor(si)} rx={si === series.length - 1 ? 4 : 0} />;
              });
            const each = inner / series.length;
            return series.map((s, si) => {
              const v = num(row[s]);
              return <rect key={`${i}-${s}`} x={xAt(i) - inner / 2 + each * si + 1} y={Math.min(y(v), y(0))} width={Math.max(1, each - 2)} height={Math.abs(y(0) - y(v))} rx={4} fill={seriesColor(si)} />;
            });
          })}
        {(type === "line" || type === "area") &&
          series.map((s, si) => {
            const top = (i: number) => (stacked ? tops[i][si] : num(rows[i][s]));
            const base = (i: number) => (stacked ? (tops[i][si - 1] ?? 0) : 0);
            const points = rows.map((_, i) => `${xAt(i).toFixed(1)},${y(top(i)).toFixed(1)}`);
            const under = rows.map((_, i) => `${xAt(i).toFixed(1)},${y(base(i)).toFixed(1)}`).reverse();
            return (
              <g key={s}>
                {type === "area" && rows.length > 1 && <path d={`M${points.join("L")}L${under.join("L")}Z`} fill={`url(#${gradient}-${si})`} />}
                <path d={`M${points.join("L")}`} fill="none" stroke={seriesColor(si)} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
                {(rows.length <= 16 || hover !== null) &&
                  rows.map((_, i) => (rows.length <= 16 || i === hover ? <circle key={i} cx={xAt(i)} cy={y(top(i))} r={i === hover ? 4.5 : 3} fill={seriesColor(si)} stroke="var(--iui-canvas)" strokeWidth={1.5} /> : null))}
              </g>
            );
          })}
        {hover !== null && type !== "bar" && <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.top} y2={pad.top + h} className="iui-chart-guide" />}
      </svg>
      {tip && (
        <div className="iui-chart-tooltip" style={{ left: Math.min(Math.max(xAt(hover!), 70), width - 70), top: pad.top }}>
          <strong>{label(tip, x)}</strong>
          {series.map((s, si) => (
            <span key={s}>
              <i style={{ background: seriesColor(si) }} />
              {series.length > 1 ? `${s} ` : ""}
              <b>{format(num(tip[s]))}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function axis(values: number[], zero: boolean) {
  const min = Math.min(...values, ...(zero ? [0] : []));
  const max = Math.max(...values, ...(zero ? [0] : []));
  const step = niceStep((max - min || Math.abs(max) || 1) / 5);
  const lo = Math.floor(min / step) * step;
  const hi = Math.max(lo + step, Math.ceil(max / step) * step);
  return { lo, hi, ticks: Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, k) => lo + k * step) };
}

/** Points with a numeric x; each series is a color. The first text key names a point in its tooltip. */
function Scatter({ spec, width }: { spec: Spec; width: number }) {
  const [hover, setHover] = useState<{ i: number; si: number } | null>(null);
  const { rows, series, height, format, x } = spec;
  const name = rows[0] ? Object.keys(rows[0]).find((k) => k !== x && typeof rows[0][k] === "string") : undefined;
  const ya = axis(rows.flatMap((r) => series.map((s) => num(r[s]))), false);
  const xa = axis(rows.map((r) => num(r[x])), false);
  const left = Math.max(...ya.ticks.map((t) => format(t, true).length)) * 6.4 + 12;
  const pad = { top: 10, right: 8, bottom: 26, left };
  const w = Math.max(10, width - pad.left - pad.right);
  const h = Math.max(10, height - pad.top - pad.bottom);
  const px = (v: number) => pad.left + ((v - xa.lo) / (xa.hi - xa.lo)) * w;
  const py = (v: number) => pad.top + h - ((v - ya.lo) / (ya.hi - ya.lo)) * h;
  const every = Math.max(1, Math.ceil((xa.ticks.length * 44) / w));
  const tip = hover && rows[hover.i];
  return (
    <div className="iui-chart-plot" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={`scatter chart of ${series.join(", ")} by ${x}`} onPointerLeave={() => setHover(null)}>
        {ya.ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={pad.left} x2={pad.left + w} y1={py(t)} y2={py(t)} className="iui-chart-grid" strokeDasharray="3 4" />
            <text x={pad.left - 10} y={py(t) + 4} textAnchor="end" className="iui-chart-tick">{format(t, true)}</text>
          </g>
        ))}
        {xa.ticks.map((t, k) => (k % every === 0 ? <text key={`x${t}`} x={px(t)} y={height - 6} textAnchor="middle" className="iui-chart-tick">{Number(t.toFixed(6)).toLocaleString("en-US", { notation: Math.abs(t) >= 1e4 ? "compact" : "standard" })}</text> : null))}
        {series.map((s, si) =>
          rows.map((r, i) => (
            <circle key={`${si}-${i}`} cx={px(num(r[x]))} cy={py(num(r[s]))} r={hover?.i === i && hover.si === si ? 6.5 : 5} fill={seriesColor(si)} fillOpacity={0.78} stroke="var(--iui-canvas)" strokeWidth={1.5} onPointerEnter={() => setHover({ i, si })} />
          )),
        )}
      </svg>
      {tip && hover && (
        <div className="iui-chart-tooltip" style={{ left: Math.min(Math.max(px(num(tip[x])), 70), width - 70), top: Math.max(0, py(num(tip[series[hover.si]])) - 70) }}>
          <strong>{name ? String(tip[name]) : series[hover.si]}</strong>
          <span>{x} <b>{num(tip[x]).toLocaleString("en-US", { maximumFractionDigits: 2 })}</b></span>
          <span><i style={{ background: seriesColor(hover.si) }} />{series[hover.si]} <b>{format(num(tip[series[hover.si]]))}</b></span>
        </div>
      )}
    </div>
  );
}

function Pie({ spec, width }: { spec: Spec; width: number }) {
  const key = spec.series[0];
  const items = spec.rows.map((row) => ({ label: label(row, spec.x), value: Math.max(0, num(key ? row[key] : 0)) }));
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const size = Math.max(80, Math.min(200, width < 420 ? width * 0.62 : 200));
  const r = size / 2;
  const inner = spec.type === "donut" ? r * 0.62 : 0;
  let angle = -Math.PI / 2;
  const point = (radius: number, a: number) => `${(r + radius * Math.cos(a)).toFixed(2)},${(r + radius * Math.sin(a)).toFixed(2)}`;
  return (
    <div className="iui-pie">
      <svg width={size} height={size} role="img" aria-label={`${spec.type} chart of ${key ?? "values"} by ${spec.x}`}>
        {items.map((item, i) => {
          const sweep = (item.value / total) * Math.PI * 2;
          const a0 = angle;
          const a1 = (angle += sweep);
          const large = sweep > Math.PI ? 1 : 0;
          if (sweep >= Math.PI * 2 - 1e-6)
            return inner ? (
              <circle key={i} cx={r} cy={r} r={(r + inner) / 2} fill="none" stroke={seriesColor(i)} strokeWidth={r - inner} />
            ) : (
              <circle key={i} cx={r} cy={r} r={r} fill={seriesColor(i)} />
            );
          const d = inner
            ? `M${point(r, a0)}A${r},${r} 0 ${large} 1 ${point(r, a1)}L${point(inner, a1)}A${inner},${inner} 0 ${large} 0 ${point(inner, a0)}Z`
            : `M${r},${r}L${point(r, a0)}A${r},${r} 0 ${large} 1 ${point(r, a1)}Z`;
          return (
            <path key={i} d={d} fill={seriesColor(i)} stroke="var(--iui-canvas)" strokeWidth={2}>
              <title>{`${item.label}: ${spec.format(item.value)}`}</title>
            </path>
          );
        })}
      </svg>
      <div className="iui-pie-legend">
        {items.map((item, i) => (
          <div key={i}>
            <i style={{ background: seriesColor(i) }} />
            <span>{item.label}</span>
            <b>{`${Math.round((item.value / total) * 1000) / 10}%`}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

const chartProps = z.object({
  type: z.enum(["bar", "line", "area", "pie", "donut", "scatter"]),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  x: z.string().optional(),
  series: z.array(z.string()).optional(),
  format: z.enum(["number", "currency", "percent"]).optional(),
  currency: z.string().optional(),
  stacked: z.boolean().optional(),
  height: z.number().optional(),
});

function toSpec(props: z.infer<typeof chartProps>): Spec | null {
  const rows = ((Array.isArray(props.data) ? props.data : []) as unknown[]).filter((r): r is Row => !!r && typeof r === "object" && !Array.isArray(r));
  const first = rows[0];
  if (!first) return null;
  const x = (props.x && props.x in first ? props.x : null) ?? Object.keys(first).find((k) => (props.type === "scatter" ? typeof first[k] === "number" : typeof first[k] === "string")) ?? Object.keys(first)[0];
  const series = (props.series?.length ? props.series.filter((s) => typeof s === "string") : Object.keys(first).filter((k) => k !== x && typeof first[k] === "number")).slice(0, 8);
  const type = (["bar", "line", "area", "pie", "donut", "scatter"] as const).includes(props.type) ? props.type : "bar";
  return {
    type,
    rows,
    x,
    series,
    stacked: !!props.stacked,
    height: Math.min(480, Math.max(140, props.height ?? 240)),
    format: makeFormat(props.format, props.currency),
  };
}

export const Chart = defineComponent({
  name: "Chart",
  props: chartProps,
  description: 'Rows of data; x is the category key (a number key for scatter), series the value keys (default: every number key). percent values are like 45; currency is a code like "EUR".',
  component: function ChartView({ props }) {
    const [ref, width] = useWidth();
    const spec = toSpec(props);
    const pie = spec?.type === "pie" || spec?.type === "donut";
    return (
      <figure className="iui-chart" ref={ref}>
        {spec && width > 0 ? pie ? <Pie spec={spec} width={width} /> : spec.type === "scatter" ? <Scatter spec={spec} width={width} /> : <Cartesian spec={spec} width={width} /> : <div style={{ height: spec?.height ?? 240 }} />}
        {spec && !pie && <Legend series={spec.series} />}
      </figure>
    );
  },
});
