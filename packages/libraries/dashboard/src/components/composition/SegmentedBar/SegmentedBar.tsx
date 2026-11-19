"use client";
import { useId, useState } from "react";
import { seriesColor } from "../../../shared/chartHelpers";
import { MUTED_COLOR } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";
import { formatValue, isRateFormat, type ValueFormat } from "../../../shared/format";
import { foldParts, previousShareOf } from "../../../shared/parts";
import { columnFormatter } from "../../../shared/scales";
import { toNumbers, toStrings } from "../../../shared/values";
import { partsNote } from "../../shared/PartNote";
import { PartsLegend } from "../../shared/PartsLegend";
import { useRowHover } from "../../shared/RowHover";
import { Empty } from "../../shared/States";
import { TextureTile } from "../../shared/TextureTile";
import { TooltipCard } from "../../shared/TooltipCard";
import { shareRows } from "../../shared/TooltipCard/shareRows";
export interface SegmentedBarProps {
  labels: string[];
  values: number[];
  format?: ValueFormat;
  previous?: number[];
}
export function SegmentedBar(props: SegmentedBarProps) {
  const bandId = `seg${useId().replace(/:/g, "")}`;
  // Hovering a part (or its legend row) fades the others, as on the Donut.
  const hover = useRowHover();
  const [legendHover, setLegendHover] = useState<string | null>(null);
  const compare = useCompare();
  const labels = toStrings(props.labels);
  const values = toNumbers(props.values).map((value) => value ?? 0);
  let parts = labels
    .map((label, i) => ({ label, value: values[i] ?? 0 }))
    .filter((part) => part.value > 0);
  const dropped = labels.filter((_, i) => !((values[i] ?? 0) > 0));
  const sharesGiven = isRateFormat(props.format);
  // Past eight, the smallest fold into Other (given order kept), the same rule as Donut and Treemap.
  const { kept, other } = foldParts(parts);
  parts = other > 0 ? [...kept, { label: "Other", value: other }] : kept;
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (!total) return <Empty />;
  const color = (part: { label: string }, i: number) =>
    part.label === "Other" ? MUTED_COLOR : seriesColor(i);
  const valueText = columnFormatter(
    parts.map((part) => part.value),
    props.format,
  );
  // Mix shift: last period's share of each part, only while compare is on.
  const shareBefore = previousShareOf(labels, compare.enabled ? props.previous : null, sharesGiven);
  const shown = parts.map((part) => part.label);
  return (
    <div
      className="openui-dashboard-fade-parts openui-dashboard-segbar-card"
      data-active={(hover.active ?? legendHover) !== null ? "" : undefined}
    >
      {/* The Donut straightened: a solid bar on top, and under each part its textured tint in its own
            hue, fading downward, as the Donut's band fades inward. Other is a plain grey tint. */}
      {/* The bar's stage takes the card's spare height, the bar centred in it. */}
      <div className="openui-dashboard-segbar-stage">
        <div
          ref={hover.ref}
          className="openui-dashboard-segbar openui-dashboard-rows"
          role="img"
          aria-label={parts
            .map((part) => `${part.label} ${formatValue((part.value / total) * 100, "percent")}`)
            .join(", ")}
        >
          {parts.map((part, i) => (
            <span
              key={`${i}-${part.label}`}
              className="openui-dashboard-seg"
              style={{ width: `${(part.value / total) * 100}%` }}
              {...hover.rowProps(part.label, () => (
                <TooltipCard
                  title={sharesGiven ? part.label : `${part.label} · ${valueText(part.value)}`}
                  rows={shareRows(
                    color(part, i),
                    sharesGiven ? part.value : (part.value / total) * 100,
                    shareBefore(part.label, shown),
                    compare.label,
                  )}
                  format={sharesGiven ? props.format : "percent"}
                />
              ))}
              data-hover={(hover.active ?? legendHover) === part.label ? "" : undefined}
            >
              <span className="openui-dashboard-seg-bar" style={{ background: color(part, i) }} />
              <svg className="openui-dashboard-seg-band" aria-hidden>
                {part.label === "Other" ? null : (
                  <defs>
                    <TextureTile
                      id={`${bandId}-${i}`}
                      index={i}
                      base={color(part, i)}
                      baseOpacity="var(--openui-dashboard-tex-tint)"
                      ink={color(part, i)}
                      opacity="var(--openui-dashboard-tex-ink)"
                    />
                  </defs>
                )}
                <rect
                  width="100%"
                  height="100%"
                  fill={
                    part.label === "Other"
                      ? `color-mix(in srgb, ${color(part, i)} 16%, transparent)`
                      : `url(#${bandId}-${i})`
                  }
                />
              </svg>
            </span>
          ))}
          {hover.tip}
        </div>
      </div>
      <PartsLegend
        parts={parts.map((part, i) => ({ ...part, color: color(part, i) }))}
        format={props.format}
        sharesGiven={sharesGiven}
        active={hover.active ?? legendHover}
        onHover={setLegendHover}
      />
      {partsNote(dropped)}
    </div>
  );
}
