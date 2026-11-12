"use client";
import { rowsNote } from "../../../components/shared/PartNote";
import { useRowHover } from "../../../components/shared/RowHover";
import { CapMark, RowGuide, TickMark } from "../../../components/shared/RowMarks";
import { ScaleAxis } from "../../../components/shared/ScaleAxis";
import { SrTable } from "../../../components/shared/SrTable";
import { Empty } from "../../../components/shared/States";
import { TooltipCard } from "../../../components/shared/TooltipCard";
import { seriesColor } from "../../../shared/colors";
import type { ValueFormat } from "../../../shared/format";
import { formatValue } from "../../../shared/format";
import { columnFormatter, niceScale } from "../../../shared/scales";
import { toNumbers, toStrings } from "../../../shared/values";

export interface DistributionProps {
  labels: string[];
  mins: number[];
  q1s: number[];
  medians: number[];
  q3s: number[];
  maxes: number[];
  format?: ValueFormat;
}

// The value column holds one number (the median); the range is drawn, and named in the tooltip.
const DIST_COLUMNS = "minmax(110px, 0.8fr) 3fr 72px";

export function Distribution(props: DistributionProps) {
  const hover = useRowHover();
  const labels = toStrings(props.labels);
  const cols = [props.mins, props.q1s, props.medians, props.q3s, props.maxes].map(toNumbers);
  if (!labels.length) return <Empty />;
  const all = cols.flat().filter((v): v is number => v !== null);
  if (!all.length) return <Empty />;
  const { x, ticks } = niceScale(all);
  const color = seriesColor(0)!;
  // The box in two shades of the series colour: the lower half (Q1 to median) deeper, the upper lighter.
  const lower = `color-mix(in srgb, ${color} 42%, var(--openui-dashboard-surface))`;
  const upper = `color-mix(in srgb, ${color} 20%, var(--openui-dashboard-surface))`;
  const whisker = "var(--openui-dashboard-ink-muted)";
  const dropped = labels.filter((_, i) => cols.some((c) => c[i] === null));
  const medianText = columnFormatter(cols[2]!, props.format);

  return (
    <div className="openui-dashboard-rowchart">
      <SrTable
        caption="Distribution by category"
        head={["Category", "Min", "Q1", "Median", "Q3", "Max"]}
        rows={labels.map((label, i) => [
          label,
          ...cols.map((c) => formatValue(c[i], props.format)),
        ])}
      />
      <div ref={hover.ref} className="openui-dashboard-rows openui-dashboard-rowchart-rows">
        {labels.map((label, i) => {
          const [min, q1, median, q3, max] = cols.map((c) => c[i]);
          if ([min, q1, median, q3, max].some((v) => v === null)) return null;
          const [lo, a, m, b, hi] = [min, q1, median, q3, max] as [
            number,
            number,
            number,
            number,
            number,
          ];
          // The encoding is named in the tooltip, so the chart needs no key line.
          const tip = () => (
            <TooltipCard
              title={label}
              format={props.format}
              // Each row wears the mark it names: whisker caps, the two box shades, the median tick.
              rows={[
                {
                  name: "Max",
                  color: whisker,
                  value: hi,
                  mark: <CapMark side="max" color={whisker} />,
                },
                { name: "Upper quartile", color: upper, value: b },
                { name: "Median", color, value: m, mark: <TickMark color={color} /> },
                { name: "Lower quartile", color: lower, value: a },
                {
                  name: "Min",
                  color: whisker,
                  value: lo,
                  mark: <CapMark side="min" color={whisker} />,
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
                gridTemplateColumns: DIST_COLUMNS,
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
                {/* Whiskers: solid at their caps, fading toward the box. */}
                <span
                  style={{
                    position: "absolute",
                    top: 13,
                    height: 1.5,
                    left: x(lo),
                    width: `calc(${x(a)} - ${x(lo)})`,
                    background: `linear-gradient(to right, ${whisker}, transparent)`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 13,
                    height: 1.5,
                    left: x(b),
                    width: `calc(${x(hi)} - ${x(b)})`,
                    background: `linear-gradient(to right, transparent, ${whisker})`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 9,
                    height: 10,
                    left: x(lo),
                    borderLeft: `1.5px solid ${whisker}`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 9,
                    height: 10,
                    left: x(hi),
                    borderLeft: `1.5px solid ${whisker}`,
                    transform: "translateX(-1.5px)",
                  }}
                />
                {/* The middle 50%, filled: the lower half deeper, the upper lighter, the median a solid line between. */}
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    height: 18,
                    left: x(a),
                    width: `calc(${x(m)} - ${x(a)})`,
                    borderRadius: "4px 0 0 4px",
                    background: lower,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    height: 18,
                    left: x(m),
                    width: `calc(${x(b)} - ${x(m)})`,
                    borderRadius: "0 4px 4px 0",
                    background: upper,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    height: 18,
                    left: x(m),
                    borderLeft: `2px solid ${color}`,
                    transform: "translateX(-1px)",
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
                <strong style={{ fontWeight: 600 }}>{medianText(m)}</strong>
              </span>
            </div>
          );
        })}
        {hover.tip}
      </div>
      <ScaleAxis ticks={ticks} x={x} format={props.format} columns={DIST_COLUMNS} />
      {rowsNote(dropped)}
    </div>
  );
}
