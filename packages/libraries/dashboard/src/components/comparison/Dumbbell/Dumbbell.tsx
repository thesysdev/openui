"use client";
import { DeltaBadge } from "../../../components/shared/DeltaBadge";
import { Legend } from "../../../components/shared/Legend";
import { rowsNote } from "../../../components/shared/PartNote";
import { useRowHover } from "../../../components/shared/RowHover";
import { RowGuide } from "../../../components/shared/RowMarks";
import { ScaleAxis } from "../../../components/shared/ScaleAxis";
import { SrTable } from "../../../components/shared/SrTable";
import { Empty } from "../../../components/shared/States";
import { TooltipCard } from "../../../components/shared/TooltipCard";
import { MUTED_COLOR, seriesColor } from "../../../shared/colors";
import type { ValueFormat } from "../../../shared/format";
import { formatValue } from "../../../shared/format";
import { columnFormatter, deltaDecimals, niceScale } from "../../../shared/scales";
import { toNumbers, toStrings } from "../../../shared/values";

export interface DumbbellProps {
  labels: string[];
  before: number[];
  after: number[];
  format?: ValueFormat;
  beforeLabel?: string;
  afterLabel?: string;
  goodWhen?: "up" | "down" | "neutral";
}

const DUMB_COLUMNS = "minmax(110px, 0.8fr) 3fr 130px";

export function Dumbbell(props: DumbbellProps) {
  const hover = useRowHover();
  const labels = toStrings(props.labels);
  const before = toNumbers(props.before);
  const after = toNumbers(props.after);
  if (!labels.length) return <Empty />;
  const all = [...before, ...after].filter((v): v is number => v !== null);
  if (!all.length) return <Empty />;
  const { x, ticks } = niceScale(all);
  // Colour is the signal here, not the series: the after dot is ink, and the connector says whether
  // the move was good (green) or bad (red) by goodWhen; grey when unchanged.
  const color = "var(--openui-dashboard-ink)";
  const goodWhen = props.goodWhen ?? "up";
  // goodWhen "neutral" compares two groups, neither direction good news: the connector takes the series colour.
  const SIGNAL = {
    better: "var(--openui-dashboard-good-mark)",
    worse: "var(--openui-dashboard-bad-mark)",
    unchanged: MUTED_COLOR,
    compared: seriesColor(0),
  } as const;
  const moveOf = (from: number, to: number): keyof typeof SIGNAL =>
    goodWhen === "neutral"
      ? "compared"
      : to === from
        ? "unchanged"
        : to > from === (goodWhen === "up")
          ? "better"
          : "worse";
  const moves = new Set(
    labels.map((_, i) =>
      before[i] !== null && after[i] !== null
        ? moveOf(before[i] as number, after[i] as number)
        : null,
    ),
  );
  const beforeLabel = props.beforeLabel ?? "Before";
  const afterLabel = props.afterLabel ?? "After";
  const dropped = labels.filter((_, i) => before[i] === null || after[i] === null);
  // One number of decimals down each column: 35.0% beside 27.4%, +3.8 pts beside +6.3 pts.
  const valueText = columnFormatter(after, props.format);
  const changeDecimals = deltaDecimals(
    labels.map((_, i) => ({ current: after[i], previous: before[i] })),
    props.format,
  );

  return (
    <div className="openui-dashboard-rowchart">
      <SrTable
        caption="Before and after by category"
        head={["Category", beforeLabel, afterLabel]}
        rows={labels.map((label, i) => [
          label,
          formatValue(before[i], props.format),
          formatValue(after[i], props.format),
        ])}
      />
      {/* The chart's own marks: a ring for before, a dot for after, then the connector's colours,
            named as Intervals names them; only those drawn. */}
      <Legend
        entries={[
          {
            name: beforeLabel,
            color,
            mark: (
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  boxShadow: `inset 0 0 0 1.5px ${color}`,
                }}
              />
            ),
          },
          {
            name: afterLabel,
            color,
            mark: <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />,
          },
          ...(["better", "worse"] as const)
            .filter((move) => moves.has(move))
            .map((move) => ({
              name: move === "better" ? "Better" : "Worse",
              color: SIGNAL[move],
              mark: (
                <span style={{ width: 14, height: 6, borderRadius: 3, background: SIGNAL[move] }} />
              ),
            })),
        ]}
      />
      <div ref={hover.ref} className="openui-dashboard-rows openui-dashboard-rowchart-rows">
        {labels.map((label, i) => {
          const a = before[i] as number | null;
          const b = after[i] as number | null;
          if (a === null || b === null) return null;
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          // The row prints the after value and the change; the tooltip adds the before value.
          const tip = () => (
            <TooltipCard
              title={label}
              format={props.format}
              goodWhen={props.goodWhen}
              // The same marks as the chart: a filled dot for after, a ring for before.
              rows={[
                {
                  name: afterLabel,
                  color,
                  value: b,
                  previous: a,
                  mark: <span className="openui-dashboard-tip-dot" style={{ background: color }} />,
                },
                {
                  name: beforeLabel,
                  color,
                  value: a,
                  mark: (
                    <span
                      className="openui-dashboard-tip-dot"
                      style={{ boxShadow: `inset 0 0 0 1.5px ${color}` }}
                    />
                  ),
                },
              ]}
            />
          );
          return (
            <div
              key={`${i}-${label}`}
              className="openui-dashboard-hrow"
              {...hover.rowProps(label, tip)}
              style={{
                display: "grid",
                gridTemplateColumns: DUMB_COLUMNS,
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
              <div style={{ position: "relative", height: 24 }}>
                <RowGuide />
                {/* The connector, as thick as the dots, carries the signal: green or red by goodWhen, strongest at the after end so the direction reads too. */}
                <span
                  style={{
                    position: "absolute",
                    top: 7,
                    height: 10,
                    borderRadius: 5,
                    left: x(lo),
                    width: `calc(${x(hi)} - ${x(lo)})`,
                    background: `linear-gradient(to ${b >= a ? "right" : "left"}, color-mix(in srgb, ${SIGNAL[moveOf(a, b)]} 25%, transparent), color-mix(in srgb, ${SIGNAL[moveOf(a, b)]} 70%, transparent))`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 7,
                    left: x(a),
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--openui-dashboard-surface)",
                    boxShadow: `inset 0 0 0 1.5px ${color}`,
                    transform: "translateX(-5px)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 7,
                    left: x(b),
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: "0 0 0 2px var(--openui-dashboard-surface)",
                    transform: "translateX(-5px)",
                  }}
                />
              </div>
              <span
                style={{
                  display: "inline-flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                <DeltaBadge
                  current={b}
                  previous={a}
                  format={props.format}
                  goodWhen={props.goodWhen}
                  inline
                  decimals={changeDecimals}
                />
                <strong style={{ fontWeight: 600 }}>{valueText(b)}</strong>
              </span>
            </div>
          );
        })}
        {hover.tip}
      </div>
      <ScaleAxis ticks={ticks} x={x} format={props.format} columns={DUMB_COLUMNS} />
      {rowsNote(dropped)}
    </div>
  );
}
