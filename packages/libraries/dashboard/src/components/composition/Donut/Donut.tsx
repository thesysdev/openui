"use client";
import { useId, useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { seriesColor } from "../../../shared/chartHelpers";
import { MUTED_COLOR } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";
import { formatValue, isRateFormat, type ValueFormat } from "../../../shared/format";
import { useWidth } from "../../../shared/hooks";
import { foldParts, previousShareOf } from "../../../shared/parts";
import { toNumbers, toStrings } from "../../../shared/values";
import { partsNote } from "../../shared/PartNote";
import { PartsLegend } from "../../shared/PartsLegend";
import { ScrollArea } from "../../shared/ScrollArea";
import { Empty } from "../../shared/States";
import { TextureTile } from "../../shared/TextureTile";
import { TooltipCard } from "../../shared/TooltipCard";
import { shareRows } from "../../shared/TooltipCard/shareRows";
export interface DonutProps {
  labels: string[];
  values: number[];
  format?: ValueFormat;
  centerLabel?: string;
  previous?: number[];
}
const MAX_SLICES = 8;
export function Donut(props: DonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const compare = useCompare();
  const patternId = useId().replace(/:/g, "");
  const [areaRef, areaWidth] = useWidth<HTMLDivElement>();
  const labels = toStrings(props.labels);
  const values = toNumbers(props.values).map((value) => value ?? 0);
  const parts = labels
    .map((label, i) => ({ label, value: values[i] ?? 0 }))
    .filter((part) => part.value > 0);
  const dropped = labels.filter((_, i) => !((values[i] ?? 0) > 0));
  // Values that are already shares (percent) would print the same number twice.
  const sharesGiven = isRateFormat(props.format);
  if (!parts.length) return <Empty />;
  // Keep the given order for colour stability; past eight parts, the smallest
  // fold into "Other" so the ring never carries more than eight slices.
  const { kept, other } = foldParts(parts, MAX_SLICES);
  const slices = [
    ...kept.map((part, i) => ({ ...part, color: seriesColor(i) })),
    ...(other > 0 ? [{ label: "Other", value: other, color: MUTED_COLOR }] : []),
  ];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  // Mix shift: last period's share of each slice, only while compare is on.
  const shareBefore = previousShareOf(labels, compare.enabled ? props.previous : null, sharesGiven);
  const shown = slices.map((slice) => slice.label);
  const k = areaWidth ? Math.min(1.2, areaWidth / 280) : 1;
  // A 4px gap between slices, measured along the thin outer arcs; the band
  // shares the same angle so the two rings stay radially aligned.
  const pad = slices.length > 1 ? (4 / (129.5 * k)) * (180 / Math.PI) : 0;
  const W = 280 * k;
  const H = 150 * k;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        flex: "1 1 auto",
        width: "100%",
      }}
    >
      {/* Semicircle: a thin rounded arc per slice with a soft tint band
            inside it; the hollow is the hover readout, so there is no
            floating tooltip. */}
      <div
        ref={areaRef}
        style={{
          // Its own height, not the card's spare: in a taller row the space falls under the legend,
          // not above the arc.
          flex: "none",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: H,
          paddingBottom: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: W,
            height: H,
            flex: "none",
            visibility: areaWidth ? undefined : "hidden",
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <PieChart width={W} height={H}>
            <defs>
              {/* One texture per slice (dots, slash, back-slash and so on) over a
                    light tint, fading out toward the band's inner edge. */}
              {slices.map((slice, i) => (
                <TextureTile
                  key={i}
                  id={`${patternId}-band-${i}`}
                  index={i}
                  base={slice.color}
                  baseOpacity="var(--openui-dashboard-tex-tint)"
                  ink={slice.color}
                  opacity="var(--openui-dashboard-tex-ink)"
                />
              ))}
              <radialGradient
                id={`${patternId}-bandfade`}
                gradientUnits="userSpaceOnUse"
                cx={W / 2}
                cy={H}
                r={125 * k}
              >
                <stop offset="76%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </radialGradient>
              <mask id={`${patternId}-bandmask`}>
                <rect x="0" y="0" width={W} height={H} fill={`url(#${patternId}-bandfade)`} />
              </mask>
            </defs>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={97 * k}
              outerRadius={125 * k}
              paddingAngle={pad}
              stroke="none"
              isAnimationActive={false}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {slices.map((slice, i) => (
                <Cell
                  key={`${i}-${slice.label}`}
                  fill={`url(#${patternId}-band-${i})`}
                  mask={`url(#${patternId}-bandmask)`}
                  fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={127 * k}
              outerRadius={132 * k}
              paddingAngle={pad}
              cornerRadius={3}
              stroke="none"
              isAnimationActive={false}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {slices.map((slice, i) => (
                <Cell
                  key={`${i}-${slice.label}`}
                  fill={slice.color}
                  fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 5 }}
              content={({ active, payload }) => {
                const slice = active
                  ? (payload?.[0]?.payload as (typeof slices)[number] | undefined)
                  : undefined;
                if (!slice) return null;
                return (
                  <TooltipCard
                    title={
                      sharesGiven
                        ? slice.label
                        : `${slice.label} · ${formatValue(slice.value, props.format)}`
                    }
                    rows={shareRows(
                      slice.color,
                      sharesGiven ? slice.value : (slice.value / total) * 100,
                      shareBefore(slice.label, shown),
                      compare.label,
                    )}
                    format={sharesGiven ? props.format : "percent"}
                  />
                );
              }}
            />
          </PieChart>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 2,
              display: "grid",
              justifyItems: "center",
              textAlign: "center",
              gap: 2,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: Math.round(20 * Math.min(k, 1.2)),
                fontWeight: 600,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatValue(total, props.format)}
            </span>
            <span style={{ fontSize: 12, color: "var(--openui-dashboard-ink-muted)" }}>
              {props.centerLabel ?? "Total"}
            </span>
          </div>
        </div>
      </div>
      {/* marginTop auto pins the legend to the card's bottom edge; the same legend as SegmentedBar's, and it scrolls only when the card is squeezed. */}
      <ScrollArea
        maxHeight={240}
        label="Scroll the legend"
        watch={slices.length}
        style={{ width: "100%", margin: "auto 0 0" }}
      >
        <PartsLegend
          parts={slices}
          format={props.format}
          sharesGiven={sharesGiven}
          active={activeIndex === null ? null : (slices[activeIndex]?.label ?? null)}
          onHover={(label) =>
            setActiveIndex(
              label === null ? null : slices.findIndex((slice) => slice.label === label),
            )
          }
        />
      </ScrollArea>
      {partsNote(dropped)}
    </div>
  );
}
