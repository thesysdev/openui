"use client";
import { useId } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, minPlotWidth, wrappedLabelWidth } from "../../../shared/chartHelpers";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { useWidth } from "../../../shared/hooks";
import { toNumbers, toStrings } from "../../../shared/values";
import { BarTexturePatterns } from "../../shared/BarTexturePatterns";
import { InkCursor } from "../../shared/InkCursor";
import { Legend } from "../../shared/Legend";
import { SrTable } from "../../shared/SrTable";
import { Empty } from "../../shared/States";
import { TooltipCard } from "../../shared/TooltipCard";
import { WrappedTick } from "../../shared/WrappedTick";
export interface WaterfallProps {
  labels: string[];
  values: number[];
  format?: ValueFormat;
  endLabel?: string;
  goodWhen?: "up" | "down" | "neutral";
  subtotals?: string[];
}
const WATERFALL_BAR = 16;
// ---------- Waterfall: how a total moved ----------
export function Waterfall(props: WaterfallProps) {
  const [chartRef, width] = useWidth<HTMLDivElement>();
  const wfTex = `wf${useId().replace(/:/g, "")}`;
  const labels = toStrings(props.labels);
  const values = toNumbers(props.values).map((value) => value ?? 0);
  const subtotals = new Set(props.subtotals ? toStrings(props.subtotals) : []);
  if (!labels.length) return <Empty />;
  let running = 0;
  const rows = labels.map((label, i) => {
    const value = values[i] ?? 0;
    // A subtotal is the running total so far, drawn from the base like the start and end.
    if (i > 0 && subtotals.has(label))
      return { label, base: 0, bar: running, value: running, kind: "total" as const };
    if (i === 0) {
      running = value;
      return { label, base: 0, bar: value, value, kind: "total" as const };
    }
    const start = running;
    running += value;
    return {
      label,
      base: Math.min(start, running),
      bar: Math.abs(value),
      value,
      kind: value >= 0 ? ("up" as const) : ("down" as const),
    };
  });
  rows.push({
    label: props.endLabel ?? "End",
    base: 0,
    bar: running,
    value: running,
    kind: "total",
  });
  const labelled = rows.map((row) => {
    // Non-breaking spaces: Recharts wraps a bar label at a space, which stacked "12.4K units" on two lines.
    const text = formatValue(row.value, props.format, { axis: true }).replace(/ /g, "\u00a0");
    return { ...row, text: row.kind === "up" ? `+${text}` : text };
  });
  // Changes carry status meaning, so they wear the status marks — the same
  // encoding as every delta — and never spend categorical hues.
  const goodWhen = props.goodWhen ?? "up";
  const good = "var(--openui-dashboard-good-mark)";
  const bad = "var(--openui-dashboard-bad-mark)";
  const color = {
    total: "var(--openui-dashboard-series-1)",
    up:
      goodWhen === "neutral"
        ? "var(--openui-dashboard-muted-mark)"
        : goodWhen === "up"
          ? good
          : bad,
    down:
      goodWhen === "neutral"
        ? "var(--openui-dashboard-muted-mark)"
        : goodWhen === "up"
          ? bad
          : good,
  };
  // Zoom to where the total moves: changes are small next to the totals, so a
  // zero-based axis would turn every change bar into a sliver.
  const levels = labelled.flatMap((row) =>
    row.kind === "total" ? [row.value] : [row.base, row.base + row.bar],
  );
  const low = Math.min(...levels);
  const high = Math.max(...levels);
  // Leave the totals a solid base below the lowest level, about 1.5× the movement.
  const pad = (high - low || Math.abs(high) || 1) * 1.5;
  // Floor at zero unless the walk itself goes below it (an operating loss), so negative ends stay visible.
  const domainMin =
    low < 0 ? low - (high - low || Math.abs(low) || 1) * 0.1 : Math.max(0, low - pad);
  // Tilt the labels only when a wrapped label is wider than its column.
  const band = width ? (width - 64) / Math.max(1, labelled.length) : 0;
  const angled =
    band > 0 && Math.max(...labelled.map((row) => wrappedLabelWidth(row.label))) > band - 6;
  const plotMin = minPlotWidth(width, labelled.length, 1, 0.22);
  // Range bars ([from, to]) rather than a stacked base: a stack can't cross zero, a range can.
  // Totals rise from the axis floor, or from zero once the walk dips below it.
  const zoomed = labelled.map((row) => ({
    ...row,
    range:
      row.kind !== "total"
        ? [row.base, row.base + row.bar]
        : low < 0
          ? [Math.min(0, row.value), Math.max(0, row.value)]
          : [domainMin, row.value],
  }));
  // Connectors: each bar hands its end level to the next, a dotted line in the
  // reference style across the gap. Bars render in order, so bar i records its
  // right edge and end level here and bar i + 1 draws the line back to it.
  const ends: { right: number; y: number }[] = [];
  const ConnectedBar = (shape: unknown) => {
    const p = shape as {
      x: number;
      y: number;
      width: number;
      height: number;
      index: number;
      payload: { kind: string };
    };
    const prev = p.index > 0 ? ends[p.index - 1]! : undefined;
    const { kind, value } = p.payload as { kind: string; value: number };
    ends[p.index] = {
      right: p.x + p.width,
      y: kind === "down" || (kind === "total" && value < 0) ? p.y + p.height : p.y,
    };
    return (
      <g>
        {prev ? (
          <line
            x1={prev.right + 2}
            x2={p.x - 2}
            y1={prev.y}
            y2={prev.y}
            stroke="var(--openui-dashboard-ink-muted)"
            strokeWidth={1.25}
            strokeDasharray="0.1 3"
            strokeLinecap="round"
          />
        ) : null}
        <Rectangle {...(shape as object)} />
      </g>
    );
  };

  return (
    <div className="openui-dashboard-chart" ref={chartRef}>
      <SrTable
        caption="How the total moved"
        head={["Step", "Value"]}
        rows={labelled.map((row) => [row.label, row.text])}
      />
      <Legend
        entries={[
          { name: "Total", color: color.total },
          { name: "Increase", color: color.up },
          { name: "Decrease", color: color.down },
        ]}
      />
      <div
        className="openui-dashboard-chart-plot"
        style={{
          minHeight: 260,
          maxHeight: 416,
          marginTop: 10,
          overflowX: plotMin ? "auto" : undefined,
        }}
      >
        {/* Past BAR_MIN the chart takes a fixed width and the plot scrolls sideways (a number, since a
              responsive container keeps its first measurement when only its parent widens). */}
        <ResponsiveContainer width={plotMin || "100%"} height="100%">
          <ComposedChart
            data={zoomed}
            margin={{ top: 18, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="22%"
          >
            <defs>
              <BarTexturePatterns
                id={wfTex}
                count={3}
                colors={[color.total, color.up, color.down]}
              />
            </defs>
            <CartesianGrid vertical={false} stroke="var(--openui-dashboard-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={<WrappedTick angled={angled} band={band} />}
              height={angled ? 56 : 36}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickCount={5}
              width={56}
              domain={[domainMin, "auto"]}
              allowDataOverflow
              tickFormatter={(value: number) => formatValue(value, props.format, { axis: true })}
            />
            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 5 }}
              cursor={<InkCursor />}
              content={({ active, payload }) => {
                const row = active
                  ? (payload?.[0]?.payload as (typeof rows)[number] | undefined)
                  : undefined;
                if (!row) return null;
                const sign = row.kind === "up" ? "+" : "";
                // No swatch: the bar under the pointer is the mark. Increases carry their sign.
                return (
                  <TooltipCard
                    title={row.label}
                    rows={[
                      {
                        name: row.kind === "total" ? "Total" : "Change",
                        color: color[row.kind]!,
                        value: row.value,
                        mark: null,
                        text: `${sign}${formatValue(row.value, props.format)}`,
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="range"
              radius={[4, 4, 4, 4]}
              maxBarSize={WATERFALL_BAR}
              isAnimationActive={false}
              shape={ConnectedBar}
            >
              {rows.map((row, keyIndex) => (
                // Textured like every bar: total dots, an increase slash (rising), a decrease back-slash (falling).
                <Cell
                  key={`${keyIndex}-${row.label}`}
                  fill={`url(#${wfTex}-tex-${row.kind === "total" ? 0 : row.kind === "up" ? 1 : 2})`}
                />
              ))}
              <LabelList
                dataKey="text"
                position="top"
                fontSize={11}
                fill="var(--openui-dashboard-ink-secondary)"
              />
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
