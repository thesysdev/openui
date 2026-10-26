import clsx from "clsx";
import { scaleLinear, scalePoint } from "d3-scale";
import { line } from "d3-shape";
import { useContainerSize } from "../../../hooks";
import { KIT_CHART_PREFIX } from "../utils/constants";
import { formatAxis, formatValue } from "../utils/format";
import { panelDomain, panelSpans, type Panel } from "./sixTwelveGeometry";
import type { SixTwelveProps } from "./types";

const P = `${KIT_CHART_PREFIX}-six-twelve`;
const GAP = 28;
const TOP = 20;
const BOTTOM = 18;
const LEFT = 34;

/**
 * The 6-12 chart from Amazon's weekly business review: the last 6 weeks and
 * the last 12 months side by side. This year is solid with dots, last year is
 * faded behind it, and the plan is dashed. Each panel has its own scale (a
 * month is about four weeks); d3 point and linear scales place everything, and
 * each point's value is in its tooltip.
 */
export function SixTwelve({
  weeks,
  months,
  format = "number",
  height = 132,
  className,
}: SixTwelveProps) {
  const [ref, size] = useContainerSize<HTMLDivElement>(480, height);
  const spans = panelSpans(size.width, GAP);
  return (
    <div ref={ref} className={clsx(P, className)} style={{ height }}>
      <svg
        width={size.width}
        height={height}
        role="img"
        aria-label="Last 6 weeks and last 12 months"
      >
        <PanelView
          panel={weeks}
          span={spans.weeks}
          height={height}
          format={format}
          title="6 weeks"
        />
        <PanelView
          panel={months}
          span={spans.months}
          height={height}
          format={format}
          title="12 months"
        />
      </svg>
    </div>
  );
}

function PanelView({
  panel,
  span,
  height,
  format,
  title,
}: {
  panel: Panel;
  span: [number, number];
  height: number;
  format: SixTwelveProps["format"];
  title: string;
}) {
  const [from, to] = panelDomain(panel);
  const x = scalePoint<string>()
    .domain(panel.labels)
    .range([span[0] + LEFT, span[1] - 4])
    .padding(0.3);
  const y = scaleLinear()
    .domain([from, to])
    .range([height - BOTTOM, TOP])
    .nice(3);
  const at = (values: number[]) =>
    line<number>()
      .defined(Number.isFinite)
      .x((_, i) => x(panel.labels[i]!) ?? 0)
      .y((v) => y(v))(values) ?? "";
  const ticks = y.ticks(3);
  // Keep every nth label so they never touch: about 6px a character plus a gap.
  const widest = Math.max(...panel.labels.map((l) => l.length)) * 6 + 10;
  const room = (span[1] - span[0] - LEFT) / Math.max(1, panel.labels.length);
  const every = Math.max(1, Math.ceil(widest / Math.max(1, room)));
  return (
    <g className={`${P}-panel`}>
      <text className={`${P}-title`} x={span[0] + LEFT} y={10}>
        {title}
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line className={`${P}-grid`} x1={span[0] + LEFT} x2={span[1]} y1={y(t)} y2={y(t)} />
          <text
            className={`${P}-tick`}
            x={span[0] + LEFT - 6}
            y={y(t)}
            dy="0.32em"
            textAnchor="end"
          >
            {formatAxis(t, format)}
          </text>
        </g>
      ))}
      {panel.labels.map((label, i) =>
        i % every === (panel.labels.length - 1) % every ? (
          <text key={label} className={`${P}-tick`} x={x(label)} y={height - 4} textAnchor="middle">
            {label}
          </text>
        ) : null,
      )}
      <path className={`${P}-year-ago`} d={at(panel.yearAgo)} />
      {panel.plan && <path className={`${P}-plan`} d={at(panel.plan)} />}
      <path className={`${P}-current`} d={at(panel.current)} />
      {panel.current.map((v, i) => (
        <circle key={i} className={`${P}-dot`} cx={x(panel.labels[i]!)} cy={y(v)} r={2.5}>
          <title>
            {`${panel.labels[i]}: ${formatValue(v, format)} · last year ${formatValue(panel.yearAgo[i]!, format)}${panel.plan ? ` · plan ${formatValue(panel.plan[i]!, format)}` : ""}`}
          </title>
        </circle>
      ))}
    </g>
  );
}
