import { radarAxisAngle, radarLabelAnchor } from "./polarUtils";

/**
 * Pure layout math for radar axis labels.
 *
 * Labels render as native SVG text inside the radar's square svg, but the svg
 * has `overflow: visible` (radarChart.scss) and each label's truncation budget
 * is computed against the CONTAINER width — the horizontal slack between the
 * square chart and the container edges is paintable label room. The svg is
 * flex-centered in the container (chartBase.scss `centered-container` /
 * `centered-svg-wrapper` mixins — a TS↔SCSS contract: if that centering ever
 * changes, `svgLeft` below must change with it), so the offset is closed-form:
 * no getBoundingClientRect, no portals.
 *
 * Vertical room is NOT borrowed from the container (the legend sits directly
 * below in a non-clipping column): `radarLabelPadding` adapts so a one-line
 * top/bottom label always fits inside the svg, and axes near vertical
 * (|sin| ≥ 0.7) are capped to one line.
 */

/** Budget inset from the container edges (absorbs measureText letter-spacing slop). */
const EDGE_MARGIN = 4;
/** Hide a label entirely when its budget is below this — never render overflow. */
export const MIN_RADAR_LABEL_BUDGET = 12;

const MAX_LABEL_PADDING = 16;
const MIN_LABEL_PADDING = 6;

export interface RadarLabelGeometry {
  chartSize: number;
  maxRadius: number;
  /** Measured chart container width; 0 on the pre-measure frame (clamped to chartSize). */
  containerWidth: number;
  /** From parseLineHeight(ctx.font). */
  lineHeight: number;
}

export interface RadarLabelLayout {
  /** Anchor x, relative to the radar center (the translated <g>). */
  x: number;
  /** Anchor y, relative to the radar center. */
  y: number;
  hAlign: "start" | "middle" | "end";
  vAlign: "top" | "middle" | "bottom";
  /** Truncation budget in px (container-coordinate, per-anchor). Never negative. */
  maxWidth: number;
  maxLines: 1 | 2;
}

/**
 * Gap between the outer ring and the label anchor. 16px when the svg has
 * vertical room to spare; shrinks (floor 6) so `maxRadius + padding +
 * lineHeight <= chartSize/2` keeps one-line top/bottom labels inside the svg.
 */
export function radarLabelPadding(chartSize: number, lineHeight: number): number {
  return Math.min(MAX_LABEL_PADDING, Math.max(MIN_LABEL_PADDING, 0.15 * chartSize - lineHeight));
}

export function radarLabelLayout(
  index: number,
  numAxes: number,
  geom: RadarLabelGeometry,
): RadarLabelLayout {
  const { chartSize, maxRadius, lineHeight } = geom;
  // Pre-measure frames report 0; minChartSize can also exceed a tiny
  // container. Either way the svg box is the floor for budget math.
  const containerWidth = Math.max(geom.containerWidth, chartSize);

  const angle = radarAxisAngle(index, numAxes);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const r = maxRadius + radarLabelPadding(chartSize, lineHeight);
  const x = r * cos;
  const y = r * sin;

  const hAlign = radarLabelAnchor(angle);
  let vAlign: RadarLabelLayout["vAlign"] = "middle";
  if (sin < -0.3) vAlign = "bottom";
  else if (sin > 0.3) vAlign = "top";

  // Near-vertical axes grow away from the anchor toward the svg edge, where
  // the adaptive padding reserves exactly one lineHeight — cap them to 1 line.
  const maxLines: RadarLabelLayout["maxLines"] = Math.abs(sin) >= 0.7 ? 1 : 2;

  const svgLeft = (containerWidth - chartSize) / 2;
  const anchorX = svgLeft + chartSize / 2 + x;
  let maxWidth: number;
  if (hAlign === "start") {
    maxWidth = containerWidth - anchorX - EDGE_MARGIN;
  } else if (hAlign === "end") {
    maxWidth = anchorX - EDGE_MARGIN;
  } else {
    maxWidth = 2 * (Math.min(anchorX, containerWidth - anchorX) - EDGE_MARGIN);
  }

  return { x, y, hAlign, vAlign, maxWidth: Math.max(0, maxWidth), maxLines };
}
