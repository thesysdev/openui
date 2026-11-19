"use client";
import { useState } from "react";
import {
  CartesianGrid,
  Scatter as RechartsScatter,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  ScatterChart,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { CHIP_ROOM, PLOT_FLOOR } from "../../../shared/chartHelpers";
import { MUTED_COLOR, seriesColor } from "../../../shared/colors";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { placeLabels } from "../../../shared/labels";
import { type MarkShape } from "../../../shared/legend";
import { keepLargest } from "../../../shared/parts";
import { InkCursor } from "../../shared/InkCursor";
import { Legend } from "../../shared/Legend";
import { PartNote } from "../../shared/PartNote";
import { PointLabels } from "../../shared/PointLabels";
import { ReferenceChipLabel } from "../../shared/ReferenceChipLabel";
import { dotFill, ScatterMark, SIZE_RANGE, type ScatterMarkProps } from "../../shared/ScatterMark";
import { SrTable } from "../../shared/SrTable";
import { Empty } from "../../shared/States";
import { TooltipCard } from "../../shared/TooltipCard";
/**
 * The hovered dot's guides and ring: the bar charts' ink cursor (full in the middle, fading to its capped ends)
 * across the plot through the dot, both ways, and a crisp ring in the dot's colour around it.
 */
function ScatterSpot({
  cx,
  cy,
  size,
  color,
}: {
  cx: number;
  cy: number;
  size: number;
  color: string;
}) {
  const plot = usePlotArea();
  if (!plot) return null;
  const r = Math.sqrt(size / Math.PI);
  return (
    <g pointerEvents="none">
      <InkCursor
        points={[
          { x: cx, y: plot.y },
          { x: cx, y: plot.y + plot.height },
        ]}
      />
      <InkCursor
        points={[
          { x: plot.x, y: cy },
          { x: plot.x + plot.width, y: cy },
        ]}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r + 4}
        fill="none"
        stroke={color}
        strokeOpacity={0.3}
        strokeWidth={4}
      />
    </g>
  );
}

/**
 * Scatter's point names: placed from the axes' own scales so none collide. Bigger dots claim
 * their spot first; a crowded name steps above or below with a hairline back to its dot.
 */
function ScatterLabels({
  points,
  areaOf,
  fadeOf,
}: {
  points: { label: string; x: number; y: number; size?: number | null; group?: string | null }[];
  areaOf: (size: number | null | undefined) => number;
  fadeOf: (group: string) => number;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;
  const items = [...points]
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .map((point, i) => ({
      key: i,
      group: point.group ?? "",
      x: xScale(point.x) ?? 0,
      y: yScale(point.y) ?? 0,
      r: Math.sqrt(areaOf(point.size) / Math.PI),
      text: point.label,
    }));
  const groupOf = new Map(items.map((item) => [item.key, item.group]));
  return (
    <PointLabels
      labels={placeLabels(items, 11, plot)}
      opacityOf={(key) => fadeOf(groupOf.get(key as number) ?? "")}
    />
  );
}

/** The x axis's first tick starts at its gridline rather than centring on it, so it clears the y axis's lowest tick at the origin. */
function OriginTick({
  x,
  y,
  payload,
  index,
  format,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  index?: number;
  format: (value: number) => string;
}) {
  return (
    <text
      x={x}
      y={(y ?? 0) + 12}
      textAnchor={index === 0 ? "start" : "middle"}
      fill="var(--openui-dashboard-ink-muted)"
      fontSize={12}
    >
      {format(payload?.value ?? 0)}
    </text>
  );
}

const MAX_GROUPS = 8;
/** Each group's dot shape, in group order, so groups differ by more than colour (as textures do on bars). */
export const GROUP_SHAPES: MarkShape[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "cross",
  "star",
  "wye",
  "circle",
];
/** The dot areas a size scales between (ZAxis range), shared with the size key. */

export interface ScatterProps {
  points: { label: string; x?: number | null; y?: number | null; size?: number; group?: string }[];
  xLabel: string;
  yLabel: string;
  xFormat?: ValueFormat;
  yFormat?: ValueFormat;
  references?: { label: string; value: number; axis?: "x" | "y" }[];
  sizeLabel?: string;
  quadrants?: string[];
}
// ---------- Scatter ----------
export function Scatter(props: ScatterProps) {
  const [active, setActive] = useState<string | null>(null);
  // The hovered dot: its position and area, for the guides and the ring around it.
  const [spot, setSpot] = useState<{
    cx: number;
    cy: number;
    size: number;
    color: string;
  } | null>(null);
  const given = (Array.isArray(props.points) ? props.points : []).filter(Boolean);
  const dropped = given
    .filter((point) => typeof point.x !== "number" || typeof point.y !== "number")
    .map((point) => point.label);
  // Names keep their spaces unbroken: Recharts wraps a label at a space.
  let points = given
    .filter((point) => typeof point.x === "number" && typeof point.y === "number")
    .map((point) => ({ ...point, tag: String(point.label ?? "").replace(/ /g, "\u00a0") }));
  if (!points.length) return <Empty />;
  // Up to eight groups; past eight, the groups with the fewest points fold into a grey Other, as on the Donut.
  const allGroups = [...new Set(points.map((point) => point.group ?? ""))];
  const count = (group: string) => points.filter((point) => (point.group ?? "") === group).length;
  const keep = keepLargest(allGroups, (group) => group, count, MAX_GROUPS);
  if (keep)
    points = points.map((point) =>
      keep.has(point.group ?? "") ? point : { ...point, group: "Other" },
    );
  const groups = [...new Set(points.map((point) => point.group ?? ""))].sort(
    (a, b) => Number(a === "Other") - Number(b === "Other"),
  );
  const groupColor = (group: string, i: number) =>
    group === "Other" ? MUTED_COLOR : seriesColor(i)!;
  const sized = points.some((point) => typeof point.size === "number");
  const labelAll = points.length <= 10;
  const references = props.references ?? [];
  const grouped = groups.length > 1 || (groups[0] ?? "") !== "";
  const shapeOf = (i: number): MarkShape =>
    grouped ? GROUP_SHAPES[i % GROUP_SHAPES.length]! : "circle";
  const sizes = points
    .map((point) => point.size)
    .filter((size): size is number => typeof size === "number");
  // The plotted area of a dot of this size: ZAxis maps the sizes linearly onto SIZE_RANGE.
  const [sizeLo, sizeHi] = sizes.length ? [Math.min(...sizes), Math.max(...sizes)] : [0, 0];
  const sizeArea = (v: number) =>
    sizeHi === sizeLo
      ? SIZE_RANGE[1]
      : SIZE_RANGE[0] + ((v - sizeLo) / (sizeHi - sizeLo)) * (SIZE_RANGE[1] - SIZE_RANGE[0]);
  // Quadrant names need a line on each axis to make the four quadrants.
  const xRef = references.find((reference) => reference.axis === "x");
  const yRef = references.find((reference) => reference.axis !== "x");
  const quadrants =
    Array.isArray(props.quadrants) && xRef && yRef ? props.quadrants.slice(0, 4) : [];
  // Each quadrant runs from its reference line out to the far edge of the data (points and lines).
  const xs = [...points.map((point) => point.x as number), ...(xRef ? [xRef.value] : [])];
  const ys = [...points.map((point) => point.y as number), ...(yRef ? [yRef.value] : [])];
  const [x0, x1] = [Math.min(0, ...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(0, ...ys), Math.max(...ys)];

  return (
    <div className="openui-dashboard-chart">
      <SrTable
        caption="Points by item"
        head={["Item", props.xLabel, props.yLabel, ...(sized ? ["Size"] : [])]}
        rows={points.map((point) => [
          point.label,
          formatValue(point.x, props.xFormat),
          formatValue(point.y, props.yFormat),
          ...(sized ? [formatValue(point.size ?? null, "number")] : []),
        ])}
      />
      {/* The legend (shapes as well as colours; hovering one fades the other groups) and, for sized dots, a size key. */}
      <div className="openui-dashboard-chart-top">
        <Legend
          entries={[
            ...groups
              .map((group, i) => ({
                name: group,
                color: groupColor(group, i),
                shape: shapeOf(i),
              }))
              .filter((entry) => entry.name),
            ...references.map((reference) => ({
              name: reference.label,
              color: "var(--openui-dashboard-ink-muted)",
              dotted: true,
            })),
          ]}
          onHover={(name) => setActive(name !== null && groups.includes(name) ? name : null)}
        />
        {sized && sizes.length
          ? (() => {
              // Three dots at the smallest, middle and largest sizes, each drawn at its plotted area
              // in the dots' own colour (grey when groups own the colours), with its value beside it.
              const sorted = [...sizes].sort((a, b) => a - b);
              const [lo, hi] = [sorted[0]!, sorted[sorted.length - 1]!];
              const steps = [...new Set([lo, sorted[Math.floor(sorted.length / 2)]!, hi])];
              const area = (v: number) =>
                hi === lo
                  ? SIZE_RANGE[1]
                  : SIZE_RANGE[0] + ((v - lo) / (hi - lo)) * (SIZE_RANGE[1] - SIZE_RANGE[0]);
              const fill = grouped ? MUTED_COLOR : seriesColor(0);
              return (
                <span
                  className="openui-dashboard-size-key"
                  aria-label={`${props.sizeLabel ?? "Size"}: ${lo} to ${hi}`}
                >
                  <span className="openui-dashboard-size-name">{props.sizeLabel ?? "Size"}</span>
                  {steps.map((v) => {
                    const d = Math.sqrt(area(v) / Math.PI) * 2;
                    return (
                      <span key={v} className="openui-dashboard-size-step">
                        <span
                          className="openui-dashboard-size-dot"
                          style={{
                            width: d,
                            height: d,
                            ["--openui-dashboard-dot" as string]: fill,
                            ["--openui-dashboard-dot-fill" as string]: `${Math.round(dotFill(area(v)) * 100)}%`,
                          }}
                        />
                        {formatValue(v, "number", { axis: true })}
                      </span>
                    );
                  })}
                </span>
              );
            })()
          : null}
      </div>
      {/* The y measure's name sits level above its axis, read left to right, not turned on its side. */}
      <div className="openui-dashboard-axis-name">{props.yLabel}</div>
      <div className="openui-dashboard-chart-plot" style={{ minHeight: PLOT_FLOOR }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: references.some((r) => r.axis === "x") ? CHIP_ROOM : 16,
              right: 24,
              bottom: 18,
              left: 4,
            }}
          >
            <CartesianGrid stroke="var(--openui-dashboard-grid)" />
            <XAxis
              type="number"
              dataKey="x"
              name={props.xLabel}
              tickLine={false}
              axisLine={false}
              tick={(tick: object) => (
                <OriginTick
                  {...tick}
                  format={(value) => formatValue(value, props.xFormat, { axis: true })}
                />
              )}
              label={{
                value: props.xLabel,
                position: "insideBottom",
                offset: -12,
                fill: "var(--openui-dashboard-ink-muted)",
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={props.yLabel}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: "var(--openui-dashboard-ink-muted)", fontSize: 12 }}
              tickFormatter={(value: number) => formatValue(value, props.yFormat, { axis: true })}
            />
            <ZAxis type="number" dataKey="size" range={sized ? SIZE_RANGE : [130, 130]} />
            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 5 }}
              cursor={false}
              content={({ active, payload }) => {
                const point = active
                  ? (payload?.[0]?.payload as ScatterProps["points"][number] | undefined)
                  : undefined;
                if (!point) return null;
                // The kit tooltip: the point, its group named in the title and shown as the swatch, each measure in its own format.
                const g = groups.indexOf(point.group ?? "");
                const dot = <span className="openui-dashboard-tip-dot" />;
                return (
                  <TooltipCard
                    title={point.group ? `${point.label} · ${point.group}` : point.label}
                    rows={[
                      {
                        name: props.xLabel,
                        color: groupColor(point.group ?? "", Math.max(g, 0)),
                        value: point.x ?? null,
                        format: props.xFormat ?? null,
                      },
                      {
                        name: props.yLabel,
                        color: "transparent",
                        value: point.y ?? null,
                        format: props.yFormat ?? null,
                        mark: dot,
                      },
                      ...(typeof point.size === "number"
                        ? [
                            {
                              name: props.sizeLabel ?? "Size",
                              color: "transparent",
                              value: point.size,
                              format: "number" as const,
                              mark: dot,
                            },
                          ]
                        : []),
                    ]}
                  />
                );
              }}
            />
            {quadrants.length && xRef && yRef
              ? (
                  [
                    "insideTopLeft",
                    "insideTopRight",
                    "insideBottomLeft",
                    "insideBottomRight",
                  ] as const
                ).map((position, q) =>
                  quadrants[q] ? (
                    // Quiet corner names for the four quadrants the two reference lines make.
                    <ReferenceArea
                      key={position}
                      x1={q % 2 === 0 ? x0 : xRef.value}
                      x2={q % 2 === 0 ? xRef.value : x1}
                      y1={q < 2 ? yRef.value : y0}
                      y2={q < 2 ? y1 : yRef.value}
                      fill="none"
                      stroke="none"
                      ifOverflow="extendDomain"
                      label={{
                        value: quadrants[q],
                        position,
                        offset: 10,
                        fontSize: 11,
                        fill: "var(--openui-dashboard-ink-muted)",
                      }}
                    />
                  ) : null,
                )
              : null}
            {references.map((reference) => (
              <ReferenceLine
                key={`${reference.label}-${reference.value}`}
                {...(reference.axis === "x" ? { x: reference.value } : { y: reference.value })}
                stroke="var(--openui-dashboard-ink-muted)"
                strokeWidth={1.5}
                strokeDasharray="0.1 4"
                strokeLinecap="round"
                ifOverflow="extendDomain"
                label={
                  <ReferenceChipLabel
                    text={`${reference.label} · ${formatValue(reference.value, reference.axis === "x" ? props.xFormat : props.yFormat)}`}
                  />
                }
              />
            ))}
            {groups.map((group, i) => (
              // Hovering a group (its dots or its legend key) fades the other groups to 35%, as on every chart.
              <RechartsScatter
                key={group || "all"}
                data={points.filter((point) => (point.group ?? "") === group)}
                shape={(mark: unknown) => (
                  <ScatterMark {...(mark as ScatterMarkProps)} type={shapeOf(i)} />
                )}
                fill={groupColor(group, i)}
                fillOpacity={active !== null && active !== group ? 0.75 * 0.35 : 0.75}
                stroke="var(--openui-dashboard-surface)"
                strokeWidth={2}
                isAnimationActive={false}
                onMouseEnter={(node: { cx?: number; cy?: number; size?: number }) => {
                  if (grouped) setActive(group);
                  if (typeof node?.cx === "number" && typeof node?.cy === "number")
                    setSpot({
                      cx: node.cx,
                      cy: node.cy,
                      size: node.size ?? 90,
                      color: groupColor(group, i),
                    });
                }}
                onMouseLeave={() => {
                  if (grouped) setActive(null);
                  setSpot(null);
                }}
              ></RechartsScatter>
            ))}
            {labelAll ? (
              <ScatterLabels
                points={
                  points as {
                    label: string;
                    x: number;
                    y: number;
                    size?: number | null;
                    group?: string | null;
                  }[]
                }
                areaOf={(size) =>
                  sized && typeof size === "number" && sizes.length ? sizeArea(size) : 130
                }
                fadeOf={(group) => (active !== null && active !== group ? 0.35 : 1)}
              />
            ) : null}
            {spot ? <ScatterSpot {...spot} /> : null}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {dropped.length ? (
        <PartNote>
          {dropped.length === 1
            ? `1 point not drawn, no x or y: ${dropped[0]}`
            : `${dropped.length} points not drawn, no x or y: ${dropped.join(", ")}`}
        </PartNote>
      ) : null}
    </div>
  );
}
