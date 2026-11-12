"use client";
import { Legend } from "../../../components/shared/Legend";
import { rowsNote } from "../../../components/shared/PartNote";
import { useRowHover } from "../../../components/shared/RowHover";
import { IntervalMark, RowGuide } from "../../../components/shared/RowMarks";
import { ScaleAxis } from "../../../components/shared/ScaleAxis";
import { SrTable } from "../../../components/shared/SrTable";
import { Empty } from "../../../components/shared/States";
import { TooltipCard } from "../../../components/shared/TooltipCard";
import type { ValueFormat } from "../../../shared/format";
import { formatValue } from "../../../shared/format";
import { columnFormatter, niceScale } from "../../../shared/scales";
import { toNumbers, toStrings } from "../../../shared/values";
import { CHIP } from "../../shared/ReferenceChipLabel";

export interface IntervalsProps {
  labels: string[];
  estimates: number[];
  lows: number[];
  highs: number[];
  format?: ValueFormat;
  baseline?: number;
  baselineLabel?: string;
  goodWhen?: "up" | "down" | "neutral";
}

export function Intervals(props: IntervalsProps) {
  const hover = useRowHover();
  const labels = toStrings(props.labels);
  const estimates = toNumbers(props.estimates);
  const lows = toNumbers(props.lows);
  const highs = toNumbers(props.highs);
  if (!labels.length) return <Empty />;
  const baseline = props.baseline ?? 0;
  const all = [...lows, ...highs, baseline].filter((value): value is number => value !== null);
  // Round ticks (…, -5, 0, 5, 10, …) and a domain that ends on them, padded past zero too,
  // so a baseline at 0 never sits on the plot's edge.
  const { x, ticks } = niceScale(all, { pad: 0.04, zeroFloor: false });
  // The value column holds one number (the estimate); the interval is drawn, and named in the tooltip.
  const columns = "minmax(110px, 0.8fr) 3fr 72px";
  const goodWhen = props.goodWhen ?? "up";
  const baselineLabel = props.baselineLabel ?? "No effect";
  // Clear of the baseline is a clear effect; which side is good comes from goodWhen.
  const verdict = (low: number, high: number) => {
    if (low <= baseline && high >= baseline)
      return { name: "No clear effect", color: "var(--openui-dashboard-muted-mark)" };
    if (goodWhen === "neutral")
      return { name: "Clear effect", color: "var(--openui-dashboard-series-1)" };
    const above = low > baseline;
    return above === (goodWhen === "up")
      ? { name: "Better", color: "var(--openui-dashboard-good-mark)" }
      : { name: "Worse", color: "var(--openui-dashboard-bad-mark)" };
  };
  type Drawn = { label: string; estimate: number; low: number; high: number };
  const rows = labels.map((label, i) => ({
    label,
    estimate: estimates[i],
    low: lows[i],
    high: highs[i],
  }));
  const drawn = rows.filter(
    (r): r is Drawn => r.estimate !== null && r.low !== null && r.high !== null,
  );
  const dropped = rows
    .filter((r) => r.estimate === null || r.low === null || r.high === null)
    .map((r) => r.label);
  const order = ["Better", "Worse", "Clear effect", "No clear effect"];
  const present = new Map(
    drawn.map((r) => verdict(r.low, r.high)).map((v) => [v.name, v.color] as const),
  );
  // An en dash between two numbers, unless a minus sign would sit beside it: then "to".
  const estimateText = columnFormatter(
    drawn.map((r) => r.estimate),
    props.format,
  );
  const range = (low: number, high: number) =>
    `${formatValue(low, props.format)}${low < 0 || high < 0 ? " to " : "–"}${formatValue(high, props.format)}`;

  return (
    <div className="openui-dashboard-rowchart">
      <SrTable
        caption="Estimates with intervals"
        head={["Category", "Estimate", "Low", "High"]}
        rows={rows.map((r) => [
          r.label,
          formatValue(r.estimate, props.format),
          formatValue(r.low, props.format),
          formatValue(r.high, props.format),
        ])}
      />
      <Legend
        entries={order
          .filter((k) => present.has(k))
          .map((k) => ({ name: k, color: present.get(k)! }))}
      />
      {/* The baseline, named in a chip where its line starts, as reference lines are. */}
      <div style={{ display: "grid", gridTemplateColumns: columns, gap: 14 }}>
        <span />
        <div style={{ position: "relative", height: 22 }}>
          <span
            className="openui-dashboard-row-chip"
            style={{
              left: x(baseline),
              height: CHIP.height,
              lineHeight: `${CHIP.height}px`,
              borderRadius: CHIP.radius,
              fontSize: CHIP.fontSize,
            }}
          >
            {baselineLabel} · {formatValue(baseline, props.format)}
          </span>
        </div>
        <span />
      </div>
      {/* The rows start 1px lower than the gap alone: the baseline's dots begin 4px under the chip, never through it. */}
      <div
        ref={hover.ref}
        className="openui-dashboard-rows openui-dashboard-rowchart-rows"
        style={{ marginTop: 1 }}
      >
        {drawn.map(({ label, estimate, low, high }, keyIndex) => {
          const { name, color } = verdict(low, high);
          const tip = () => (
            <TooltipCard
              title={label}
              format={props.format}
              // Each row wears its mark: the estimate's dot, the interval with its caps; the verdict is the footnote.
              rows={[
                {
                  name: "Estimate",
                  color,
                  value: estimate,
                  mark: <span className="openui-dashboard-tip-dot" style={{ background: color }} />,
                },
                {
                  name: "Interval",
                  color,
                  value: null,
                  mark: <IntervalMark color={color} />,
                  text: range(low, high),
                },
              ]}
              note={name}
            />
          );
          return (
            <div
              key={`${keyIndex}-${label}`}
              className="openui-dashboard-hrow"
              {...hover.rowProps(label, tip)}
              style={{
                display: "grid",
                gridTemplateColumns: columns,
                alignItems: "center",
                gap: 14,
                fontSize: 13,
              }}
            >
              <span
                style={{
                  lineHeight: 1.3,
                  overflowWrap: "anywhere",
                  color: "var(--openui-dashboard-ink-secondary)",
                }}
              >
                {label}
              </span>
              <div style={{ position: "relative", height: 28 }}>
                <RowGuide />
                {/* The baseline, dotted like every reference line, running down from its chip. */}
                <span className="openui-dashboard-row-baseline" style={{ left: x(baseline) }} />
                {/* The interval, 2px: ink at its caps, the verdict colour on the way in, fading out at the estimate. */}
                <span
                  style={{
                    position: "absolute",
                    top: 13,
                    height: 2,
                    borderRadius: 2,
                    left: x(low),
                    width: `calc(${x(high)} - ${x(low)})`,
                    background: (() => {
                      const at = high > low ? ((estimate - low) / (high - low)) * 100 : 50;
                      const faint = `color-mix(in srgb, ${color} 10%, transparent)`;
                      return `linear-gradient(to right, var(--openui-dashboard-ink), ${color} ${at / 2}%, ${faint} ${at}%, ${color} ${at + (100 - at) / 2}%, var(--openui-dashboard-ink))`;
                    })(),
                  }}
                />
                {/* End caps in ink, continuing the line's black ends. */}
                <span
                  style={{
                    position: "absolute",
                    top: 9,
                    height: 10,
                    left: x(low),
                    borderLeft: "1.5px solid var(--openui-dashboard-ink)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 9,
                    height: 10,
                    left: x(high),
                    borderLeft: "1.5px solid var(--openui-dashboard-ink)",
                    transform: "translateX(-1.5px)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 10.5,
                    left: x(estimate),
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: color,
                    transform: "translateX(-3.5px)",
                    boxShadow: "0 0 0 2px var(--openui-dashboard-surface)",
                  }}
                />
              </div>
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                <strong style={{ fontWeight: 600 }}>{estimateText(estimate)}</strong>
              </span>
            </div>
          );
        })}
        {hover.tip}
      </div>
      <ScaleAxis ticks={ticks} x={x} format={props.format} columns={columns} />
      {rowsNote(dropped)}
    </div>
  );
}
