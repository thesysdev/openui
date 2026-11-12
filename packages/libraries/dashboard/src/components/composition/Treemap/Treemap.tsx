"use client";
import { useId, useState } from "react";
import { Treemap as RechartsTreemap, ResponsiveContainer, Tooltip } from "recharts";
import { PLOT_FLOOR, seriesColor } from "../../../shared/chartHelpers";
import { MUTED_COLOR } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";
import type { ValueFormat } from "../../../shared/format";
import { formatValue } from "../../../shared/format";
import { keepLargest, previousShareOf } from "../../../shared/parts";
import { toNumbers, toStrings } from "../../../shared/values";
import { Legend } from "../../shared/Legend";
import { partsNote } from "../../shared/PartNote";
import { SrTable } from "../../shared/SrTable";
import { Empty } from "../../shared/States";
import { TextureTile } from "../../shared/TextureTile";
import { TooltipCard } from "../../shared/TooltipCard";
("use client");
export interface TreemapProps {
  labels: string[];
  values: number[];
  format?: ValueFormat;
  previous?: number[];
  groups?: string[];
}
type TreeLeaf = { name: string; value: number; color: string; group?: string; texture: number };

function TreemapCell(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
  name?: string;
  value?: number;
  color?: string;
  texture?: number;
  children?: unknown;
  format?: ValueFormat | null;
  patternId?: string;
  group?: string;
  active?: string | null;
  onHover?: (key: string | null) => void;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name,
    value,
    color,
    children,
    texture = 0,
    patternId = "tm",
  } = props;
  const key = `${props.group ?? ""}/${name ?? ""}`;
  const pid = `${patternId}-${Math.round(x)}-${Math.round(y)}`;
  // Only leaves draw; group nodes are the gaps between their leaves.
  if (children || !color || width <= 0 || height <= 0) return null;
  const roomy = width > 64 && height > 34;
  const label =
    name && name.length * 7 > width - 14
      ? `${name.slice(0, Math.max(1, Math.floor((width - 14) / 7) - 1))}…`
      : name;
  const valueText = height > 48 ? formatValue(value ?? null, props.format) : null;
  const tint = `color-mix(in srgb, ${color} 22%, var(--openui-dashboard-surface))`;
  return (
    // Hovering a tile fades the others to 35%, as the Donut's slices do.
    <g
      className="openui-dashboard-treemap-cell"
      opacity={props.active && props.active !== key ? 0.35 : 1}
      onMouseEnter={() => props.onHover?.(key)}
      onMouseLeave={() => props.onHover?.(null)}
    >
      {/* The group's texture in its own hue over the light tint, as on the Donut; the surface stroke on top keeps the gaps. */}
      <defs>
        <TextureTile
          id={pid}
          index={texture}
          ink={color}
          opacity="var(--openui-dashboard-tex-ink)"
        />
        {/* The texture fades out toward the top of the tile, so the label sits on the plain tint. */}
        <linearGradient id={`${pid}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`${pid}-mask`}>
          <rect x={x} y={y} width={width} height={height} fill={`url(#${pid}-fade)`} />
        </mask>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={tint} />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={`url(#${pid})`}
        mask={`url(#${pid}-mask)`}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill="none"
        stroke="var(--openui-dashboard-surface)"
        strokeWidth={3}
      />
      <rect
        x={x + 6}
        y={y + 6}
        width={Math.max(0, Math.min(18, width - 12))}
        height={3}
        rx={1.5}
        fill={color}
      />
      {roomy ? (
        <>
          <text
            x={x + 8}
            y={y + 24}
            fontSize={12}
            fontWeight={500}
            fill="var(--openui-dashboard-ink)"
          >
            {label}
          </text>
          {valueText ? (
            <text x={x + 8} y={y + 40} fontSize={11} fill="var(--openui-dashboard-ink-secondary)">
              {valueText}
            </text>
          ) : null}
        </>
      ) : null}
    </g>
  );
}

export function Treemap(props: TreemapProps) {
  const treemapId = `tm${useId().replace(/:/g, "")}`;
  const [activeTile, setActiveTile] = useState<string | null>(null);
  const compare = useCompare();
  const labels = toStrings(props.labels);
  // Mix shift: last period's share of each item (items never fold, only groups), while compare is on.
  const shareBefore = previousShareOf(labels, compare.enabled ? props.previous : null, false);
  const values = toNumbers(props.values);
  const groups = props.groups ? toStrings(props.groups) : null;
  const dropped = labels.filter((_, i) => !((values[i] ?? 0) > 0));
  let leaves = labels
    .map((name, i) => ({ name, value: values[i] ?? 0, group: groups?.[i] ?? "" }))
    .filter((leaf) => leaf.value > 0);
  if (!leaves.length) return <Empty />;
  const total = leaves.reduce((sum, leaf) => sum + leaf.value, 0);
  // Eight hues at most: past eight groups, the smallest fold into a grey Other, as on the Donut.
  const allGroups = groups ? [...new Set(leaves.map((leaf) => leaf.group))] : [];
  const sizeOf = (group: string) =>
    leaves.filter((leaf) => leaf.group === group).reduce((sum, leaf) => sum + leaf.value, 0);
  const keep = keepLargest(allGroups, (group) => group, sizeOf);
  if (keep)
    leaves = leaves.map((leaf) => (keep.has(leaf.group) ? leaf : { ...leaf, group: "Other" }));
  const groupNames = groups
    ? [...new Set(leaves.map((leaf) => leaf.group))].sort(
        (a, b) => Number(a === "Other") - Number(b === "Other"),
      )
    : [];
  const colorOf = (i: number) => (groupNames[i]! === "Other" ? MUTED_COLOR : seriesColor(i));
  const data = groups
    ? groupNames.map((group, gi) => ({
        name: group,
        children: leaves
          .filter((leaf) => leaf.group === group)
          .map((leaf): TreeLeaf => ({ ...leaf, color: colorOf(gi), texture: gi })),
      }))
    : // Flat: one hue — area and label carry it; colour is reserved for groups.
      leaves.map((leaf): TreeLeaf => ({ ...leaf, color: seriesColor(0), texture: 0 }));

  return (
    <div className="openui-dashboard-chart">
      <SrTable
        caption="Parts of the whole"
        head={groups ? ["Group", "Item", "Value"] : ["Item", "Value"]}
        rows={leaves.map((leaf) =>
          groups
            ? [leaf.group, leaf.name, formatValue(leaf.value, props.format)]
            : [leaf.name, formatValue(leaf.value, props.format)],
        )}
      />
      {groups ? (
        <Legend entries={groupNames.map((group, gi) => ({ name: group, color: colorOf(gi) }))} />
      ) : null}
      {/* At least its height (280px by default), growing to fill a taller card. */}
      <div className="openui-dashboard-chart-plot" style={{ minHeight: PLOT_FLOOR, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsTreemap
            data={data}
            dataKey="value"
            nameKey="name"
            isAnimationActive={false}
            content={
              <TreemapCell
                format={props.format}
                patternId={treemapId}
                active={activeTile}
                onHover={setActiveTile}
              />
            }
          >
            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 5 }}
              content={({ active, payload }) => {
                const leaf = active ? (payload?.[0]?.payload as TreeLeaf | undefined) : undefined;
                if (!leaf || !leaf.color) return null;
                return (
                  <TooltipCard
                    title={leaf.group ? `${leaf.group} · ${leaf.name}` : leaf.name}
                    rows={[
                      { name: "Value", color: leaf.color, value: leaf.value },
                      {
                        name: "Share",
                        color: "transparent",
                        value: (leaf.value / total) * 100,
                        previous: shareBefore(leaf.name, labels),
                        format: "percent",
                        mark: <span className="openui-dashboard-tip-dot" />,
                      },
                      ...(shareBefore(leaf.name, labels) !== null
                        ? [
                            {
                              name: compare.label,
                              color: MUTED_COLOR,
                              value: shareBefore(leaf.name, labels),
                              format: "percent" as const,
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
          </RechartsTreemap>
        </ResponsiveContainer>
      </div>
      {/* A legend row, as in the Donut and SegmentedBar legends: what area means on the left, the total at the right edge. */}
      <div className="openui-dashboard-treemap-foot">
        <span className="openui-dashboard-treemap-key">
          <span className="openui-dashboard-treemap-glyph" aria-hidden />
          Area is each part's share of the total
        </span>
        <span className="openui-dashboard-treemap-total">
          <span>Total</span>
          <strong>{formatValue(total, props.format)}</strong>
        </span>
      </div>
      {partsNote(dropped)}
    </div>
  );
}
