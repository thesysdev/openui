"use client";
import { MUTED_COLOR } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";
import { Legend } from "../../shared/Legend";

import { useId } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SrTable } from "../../../components/shared/SrTable";
import { Empty } from "../../../components/shared/States";
import { TooltipCard } from "../../../components/shared/TooltipCard";
import { seriesColor } from "../../../shared/colors";
import { dateLabels, formatValue } from "../../../shared/format";
import { useWidth } from "../../../shared/hooks";
import { niceStep } from "../../../shared/scales";
import { toNumbers, toStrings } from "../../../shared/values";
import { InkCursor } from "../../shared/InkCursor";

import type { ValueFormat } from "../../../shared/format";
export interface SmallMultiplesProps {
  labels: string[];
  series: { name: string; values: unknown; previous?: unknown }[];
  type?: "line" | "area";
  format?: ValueFormat;
  columns?: number;
}

export function SmallMultiples(props: SmallMultiplesProps) {
  const id = useId().replace(/:/g, "");
  const [gridRef, width] = useWidth();
  const compare = useCompare();
  const labels = toStrings(props.labels);
  // Dates in the tooltip read "May 14", not 2026-05-14.
  const labelText = dateLabels(labels);
  const series = props.series;
  if (!labels.length || !series.length) return <Empty />;
  const type = props.type ?? "area";
  // The previous period, as on TimeSeries: a grey dashed line in every panel while compare is on.
  const hasPrevious = series.some((s) => toNumbers(s.previous).some((v) => v !== null));
  const showPrevious = compare.enabled && hasPrevious;
  const values = series
    .flatMap((s) => [...toNumbers(s.values), ...(showPrevious ? toNumbers(s.previous) : [])])
    .filter((v): v is number => v !== null);
  if (!values.length) return <Empty />;
  // One scale for every panel, so heights compare across the grid. Areas
  // start at zero; lines zoom to the data.
  const lo = type === "line" ? Math.min(...values) : Math.min(0, ...values);
  const hi = Math.max(...values);
  const step = niceStep((hi - lo || 1) / 4);
  const domain: [number, number] = [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
  const color = seriesColor(0)!;
  // Panels sit in measured rows (like the Kpis strip) so dotted rules can run
  // between rows and between the panels in a row.
  // Guard a zero, negative or fractional count: the panel loop below steps by cols.
  const cols = Math.max(1, Math.floor(props.columns ?? (width + 20) / (180 + 20)));
  const panelRows: (typeof series)[] = [];
  for (let i = 0; i < series.length; i += cols) panelRows.push(series.slice(i, i + cols));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Keyed only when there is a previous period; kept in place (hidden) while compare is off, so nothing moves. */}
      {hasPrevious ? (
        <div
          style={{ visibility: showPrevious ? undefined : "hidden" }}
          aria-hidden={!showPrevious || undefined}
        >
          <Legend entries={[{ name: compare.label, color: MUTED_COLOR, dashed: true }]} />
        </div>
      ) : null}
      <SrTable
        caption="Small multiples data"
        head={["Period", ...series.map((s) => s.name)]}
        rows={labels.map((label, j) => [
          label,
          ...series.map((s) => formatValue(toNumbers(s.values)[j], props.format)),
        ])}
      />
      <div className="openui-dashboard-sm" ref={gridRef}>
        {panelRows.map((row, r) => (
          <div
            key={r}
            className="openui-dashboard-sm-row"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {row.map((s, k) => {
              const i = r * cols + k;
              const points = toNumbers(s.values);
              const before = toNumbers(s.previous);
              const rows = labels.map((label, j) => ({
                label,
                v: points[j] ?? null,
                p: showPrevious ? (before[j] ?? null) : null,
              }));
              const last = [...points].reverse().find((v): v is number => v !== null);
              return (
                <div key={`${s.name}-${i}`} className="openui-dashboard-sm-cell">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--openui-dashboard-ink-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={s.name}
                    >
                      {s.name}
                    </span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {formatValue(last ?? null, props.format)}
                    </span>
                  </div>
                  <div style={{ height: 84, marginTop: 6 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={rows} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                        <defs>
                          <linearGradient id={`${id}-wash`} x1="0" x2="0" y1="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor={color}
                              style={{ stopOpacity: "var(--openui-dashboard-area-wash)" }}
                            />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                          {/* The TimeSeries area texture: dots in the series hue, fading out toward the baseline. */}
                          <pattern
                            id={`${id}-dots`}
                            width="6"
                            height="6"
                            patternUnits="userSpaceOnUse"
                            patternTransform="rotate(45)"
                          >
                            <circle
                              cx="1.8"
                              cy="1.8"
                              r="0.8"
                              fill={color}
                              style={{ opacity: "var(--openui-dashboard-area-dot)" }}
                            />
                          </pattern>
                          <linearGradient id={`${id}-dotfade`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </linearGradient>
                          <mask id={`${id}-dotmask`}>
                            <rect
                              x="0"
                              y="0"
                              width="100%"
                              height="100%"
                              fill={`url(#${id}-dotfade)`}
                            />
                          </mask>
                        </defs>
                        <XAxis dataKey="label" hide />
                        <YAxis hide domain={domain} />
                        {/* The shared scale, drawn in every panel and labelled once per row. */}
                        {domain.map((edge, e) => (
                          <ReferenceLine
                            key={e}
                            y={edge}
                            stroke="var(--openui-dashboard-grid)"
                            ifOverflow="extendDomain"
                            label={
                              k === 0
                                ? {
                                    value: formatValue(edge, props.format, { axis: true }),
                                    position: e ? "insideTopLeft" : "insideBottomLeft",
                                    fontSize: 11,
                                    fill: "var(--openui-dashboard-ink-muted)",
                                    offset: 4,
                                  }
                                : undefined
                            }
                          />
                        ))}
                        <Tooltip
                          isAnimationActive={false}
                          wrapperStyle={{ zIndex: 5 }}
                          cursor={<InkCursor />}
                          content={({ active, payload, label }) => {
                            const row = active
                              ? (payload?.[0]?.payload as
                                  { v: number | null; p: number | null } | undefined)
                              : undefined;
                            if (!row || row.v === null) return null;
                            return (
                              <TooltipCard
                                title={(labelText ?? String)(String(label))}
                                rows={[
                                  {
                                    name: s.name,
                                    color,
                                    value: row.v,
                                    previous: showPrevious ? row.p : null,
                                  },
                                  ...(showPrevious && row.p !== null
                                    ? [
                                        {
                                          name: compare.label,
                                          color: MUTED_COLOR,
                                          value: row.p,
                                          dashed: true,
                                        },
                                      ]
                                    : []),
                                ]}
                                format={props.format}
                              />
                            );
                          }}
                        />
                        {showPrevious ? (
                          <Line
                            dataKey="p"
                            type="monotone"
                            stroke={MUTED_COLOR}
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={false}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        ) : null}
                        {type === "line" ? (
                          <Line
                            dataKey="v"
                            type="monotone"
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        ) : (
                          <>
                            {/* Dots under the wash, so the stroke stays clean on top, as in TimeSeries. */}
                            <Area
                              dataKey="v"
                              type="monotone"
                              stroke="none"
                              fill={`url(#${id}-dots)`}
                              mask={`url(#${id}-dotmask)`}
                              dot={false}
                              activeDot={false}
                              tooltipType="none"
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                            <Area
                              dataKey="v"
                              type="monotone"
                              stroke={color}
                              strokeWidth={2}
                              fill={`url(#${id}-wash)`}
                              dot={false}
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                          </>
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 4,
                      fontSize: 11,
                      color: "var(--openui-dashboard-ink-muted)",
                    }}
                  >
                    <span>{labels[0]}</span>
                    <span>{labels[labels.length - 1]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
