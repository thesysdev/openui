import React, { useMemo, useRef } from "react";

import type { FunnelStage } from "../../hooks/cartesian/useFunnelChartOrchestrator";
import { useCanvasContextForLabelSize } from "../../hooks/core/useCanvasContextForLabelSize";
import { useIndexedClickHandler } from "../../hooks/core/useIndexedClickHandler";
import { useIsomorphicLayoutEffect, useSpring } from "../../shared/core/spring";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import { entranceProps } from "../../utils/entranceUtils";
import {
  MAX_LABEL_LINES,
  parseLineHeight,
  truncateToWidth,
  wrapLabelLines,
} from "../../utils/labelWrap";
import { numberTickFormatter } from "../../utils/styleUtils";
import {
  type FunnelEdges,
  type FunnelOrientation,
  funnelHaloRamp,
  hSegmentPath,
  vSegmentPath,
} from "./funnelGeometry";

const CLASS = `${CHART_CLASS_PREFIX}-funnel-chart`;
// Non-hovered stages dim to this fill-opacity multiplier.
const DIM = 0.4;
// Below this cell size (px on the stacking axis) the in-cell value/percentage
// are dropped — they'd overflow. Labels live in their own axis band and are
// always shown (angled/wrapped/truncated to fit).
const MIN_TEXT_CELL = 44;
// Gap between the funnel plot and its label band/column (matches the
// orchestrator's reservation).
const LABEL_GAP = 6;
// Rough per-char width for the percentage pill background (no canvas measure).
const PILL_CHAR_PX = 8;

interface FunnelStagesProps<T> {
  stages: FunnelStage[];
  rows: T[];
  orientation: FunnelOrientation;
  edges: FunnelEdges;
  layers: number;
  /** Full plot extent (stages tile along the main axis across this). */
  W: number;
  H: number;
  /** Ring (plot) area — the container minus the reserved label band/column.
   * The reserved band is implicitly H−ringH (horizontal) / W−ringW (vertical). */
  ringW: number;
  ringH: number;
  /** Width of the reserved vertical label column (for multi-line wrapping). */
  labelColWidth: number;
  /** Shared rotation (deg) for horizontal labels that don't fit; 0 = upright. */
  labelAngle: number;
  gap: number;
  showLabels: boolean;
  showValues: boolean;
  showPercentage: boolean;
  /** Play the entrance (pre-folded with ¬printing at the entry). */
  animate: boolean;
  /** Print/static: no hitbox, no entrance. */
  staticRender: boolean;
  hoveredIndex: number | null;
  onMouseMove: (event: React.MouseEvent, index: number) => void;
  onMouseLeave: () => void;
  onClick?: (row: T, index: number) => void;
}

/**
 * The funnel painter. Each stage is a `<g transform>` (positioning) wrapping an
 * inner `<g>` of N concentric halo rings drawn OUTERMOST-FIRST (SVG order is
 * z-order → the solid core paints last). The halo is built from `fill-opacity`
 * per ring — NEVER `opacity` (the entrance keyframe's forwards fill holds
 * `opacity:1` and would defeat an opacity dim). Stage labels live in a reserved
 * axis band (bottom for horizontal, right column for vertical) and reuse the
 * library's label machinery: angled when a horizontal label can't fit its cell
 * (`useAutoAngleCalculation` in the orchestrator), multi-line wrapped when a
 * vertical label is too long. Value/percentage stay in-cell. A transparent
 * full-cell hitbox owns the pointer.
 */
export function FunnelStages<T>({
  stages,
  rows,
  orientation,
  edges,
  layers,
  W,
  H,
  ringW,
  ringH,
  labelColWidth,
  labelAngle,
  gap,
  showLabels,
  showValues,
  showPercentage,
  animate,
  staticRender,
  hoveredIndex,
  onMouseMove,
  onMouseLeave,
  onClick,
}: FunnelStagesProps<T>) {
  const ctx = useCanvasContextForLabelSize();

  const handleClick = useIndexedClickHandler(rows, onClick);

  const horiz = orientation === "horizontal";
  const straight = edges === "straight";
  const n = stages.length;
  const totalGap = gap * Math.max(0, n - 1);
  // mainSize = each cell's size along the stacking axis; crossSize = the ring's
  // span on the other axis (the plot area minus the reserved label band).
  // n is ≥ 1 in practice (useSeriesVisibility keeps a stage visible, and empty
  // data hits the placeholder), but guard the divide so n=0 can't yield ∞.
  const mainSize = n > 0 ? Math.max(0, (horiz ? W - totalGap : H - totalGap) / n) : 0;
  const crossSize = horiz ? ringH : ringW;
  const rings = funnelHaloRamp(layers);
  // In-cell value/pct need room on BOTH axes — crossSize collapses to 0 when
  // the label column eats the whole width (extreme-narrow vertical funnel),
  // which would paint the centered pill at a negative x.
  const showInCell = mainSize >= MIN_TEXT_CELL && crossSize > 0;
  const lineHeight = parseLineHeight(ctx.font);
  const isAngled = horiz && labelAngle !== 0;

  return (
    <g>
      {stages.map((stage, i) => {
        const offset = (mainSize + gap) * i;
        const transform = horiz ? `translate(${offset}, 0)` : `translate(0, ${offset})`;
        const isHovered = hoveredIndex === i;
        const dimFactor = hoveredIndex !== null && !isHovered ? DIM : 1;

        const ringPaths = rings.map((r) =>
          horiz
            ? hSegmentPath(stage.norm, stage.normEnd, mainSize, crossSize, r.layerScale, straight)
            : vSegmentPath(stage.norm, stage.normEnd, mainSize, crossSize, r.layerScale, straight),
        );

        // In-cell anchors (value top/left, percentage centered on the ring).
        const valueX = horiz ? mainSize / 2 : 8;
        const valueY = horiz ? 14 : mainSize / 2;
        const pctX = horiz ? mainSize / 2 : crossSize / 2;
        const pctY = horiz ? crossSize / 2 : mainSize / 2;
        const pctText = `${Math.round(stage.pct)}%`;
        const pillW = pctText.length * PILL_CHAR_PX + 16;

        // Label anchor — at the start of the reserved band/column.
        const labelX = horiz ? mainSize / 2 : crossSize + LABEL_GAP;
        const labelY = horiz ? crossSize + LABEL_GAP : mainSize / 2;
        const labelLines =
          showLabels && !horiz
            ? wrapLabelLines(
                ctx,
                stage.label,
                Math.max(0, labelColWidth - LABEL_GAP * 2),
                MAX_LABEL_LINES,
              )
            : null;
        const horizLabel =
          showLabels && horiz
            ? isAngled
              ? stage.label
              : truncateToWidth(ctx, stage.label, mainSize)
            : null;

        const { className: stageAnimatedClass, animationDelay } = entranceProps(
          animate,
          `${CLASS}-stage--animated`,
          i * 60,
        );

        return (
          <g key={stage.key} transform={transform}>
            <g
              className={`${CLASS}-stage${stageAnimatedClass ? ` ${stageAnimatedClass}` : ""}`}
              style={{
                animationDelay,
                filter: isHovered ? "brightness(1.08)" : undefined,
                pointerEvents: "none",
              }}
            >
              {ringPaths.map((d, ri) =>
                // Print/static: inert paths, no springs (the bklit-style hover
                // bloom is interaction feedback). Otherwise each ring owns a
                // spring that scales it on the cross axis when its stage is
                // hovered. ri is a stable position in the fixed-length ramp.
                staticRender ? (
                  <path
                    key={ri}
                    className={`${CLASS}-ring`}
                    d={d}
                    fill={stage.color}
                    fillOpacity={rings[ri]!.ringOpacity * dimFactor}
                  />
                ) : (
                  <FunnelRing
                    key={ri}
                    d={d}
                    color={stage.color}
                    fillOpacity={rings[ri]!.ringOpacity * dimFactor}
                    hovered={isHovered}
                    ringIndex={ri}
                    totalRings={rings.length}
                    horizontal={horiz}
                  />
                ),
              )}
            </g>

            {/* In-cell value + percentage (dropped when the cell is too small;
                the tooltip still gives exact values). */}
            {showInCell && (
              <g
                className={`${CLASS}-readouts`}
                style={{
                  pointerEvents: "none",
                  opacity: dimFactor === DIM ? 0.55 : 1,
                }}
              >
                {showValues && (
                  <text
                    className={`${CLASS}-value`}
                    x={valueX}
                    y={valueY}
                    textAnchor={horiz ? "middle" : "start"}
                    dominantBaseline={horiz ? "hanging" : "central"}
                  >
                    {numberTickFormatter(stage.value)}
                  </text>
                )}
                {showPercentage && (
                  <>
                    <rect
                      className={`${CLASS}-pct-pill`}
                      x={pctX - pillW / 2}
                      y={pctY - 10}
                      width={pillW}
                      height={20}
                      rx={10}
                    />
                    <text
                      className={`${CLASS}-pct`}
                      x={pctX}
                      y={pctY}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {pctText}
                    </text>
                  </>
                )}
              </g>
            )}

            {/* Stage label in the reserved axis band — always shown. */}
            {showLabels && (
              <g
                className={`${CLASS}-labels`}
                style={{
                  pointerEvents: "none",
                  opacity: dimFactor === DIM ? 0.55 : 1,
                }}
              >
                {horiz ? (
                  <text
                    className={`${CLASS}-label`}
                    x={labelX}
                    y={labelY}
                    textAnchor={isAngled ? "end" : "middle"}
                    dominantBaseline="hanging"
                    transform={isAngled ? `rotate(${labelAngle}, ${labelX}, ${labelY})` : undefined}
                  >
                    {horizLabel}
                  </text>
                ) : (
                  <text
                    className={`${CLASS}-label`}
                    x={labelX}
                    y={labelY - ((labelLines!.length - 1) * lineHeight) / 2}
                    textAnchor="start"
                    dominantBaseline="central"
                  >
                    {labelLines!.map((line, li) => (
                      <tspan key={li} x={labelX} dy={li === 0 ? 0 : lineHeight}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            )}

            {/* Transparent hitbox: owns the pointer for the whole cell
                (including the label band). fill MUST be a painted region
                (`transparent`, not `none`) or hover dies under the default
                `visiblePainted`. Dropped in print. */}
            {!staticRender && (
              <rect
                x={0}
                y={0}
                width={horiz ? mainSize : W}
                height={horiz ? H : mainSize}
                fill="transparent"
                style={{
                  pointerEvents: "all",
                  cursor: onClick ? "pointer" : undefined,
                }}
                onMouseMove={(e) => onMouseMove(e, i)}
                onMouseLeave={onMouseLeave}
                onClick={() => handleClick(i)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

interface FunnelRingProps {
  d: string;
  color: string;
  fillOpacity: number;
  hovered: boolean;
  ringIndex: number;
  totalRings: number;
  horizontal: boolean;
}

/**
 * One halo ring with bklit's hover bloom, driven by the vanilla spring instead
 * of motion. The inner rings scale up more (up to +12%) and SOFTER (lower
 * stiffness), the outer halo barely moves — so the solid core swells outward
 * through the halo on hover; a lone ring (layers=1) blooms as the core.
 *
 * The spring drives a CSS variable (the scale MAGNITUDE) off the render path;
 * the AXIS lives in CSS, picked by the orientation class (--bloom-y scales
 * height, --bloom-x scales width). Keeping the axis in CSS — rather than
 * baking scaleX/scaleY into the written string — means an orientation flip
 * (which React applies via the class) can never strand a stale axis on an
 * at-rest ring. The origin is the ring's own centre (transform-box: fill-box).
 * Rest IS home (scale 1), so there's no seeded jump — the first hover is the
 * bloom. Mounted only off the print path (FunnelStages branches on static).
 */
function FunnelRing({
  d,
  color,
  fillOpacity,
  hovered,
  ringIndex,
  totalRings,
  horizontal,
}: FunnelRingProps) {
  const ref = useRef<SVGPathElement>(null);
  // Inner rings bloom more (the solid core most); a lone ring is the core. The
  // 0.12 headroom matches the 0.44 cross-axis factor (segments span 0.88 of
  // the cross axis), so the bloom never clips the cell.
  const extraScale = totalRings <= 1 ? 1.12 : 1 + (ringIndex / (totalRings - 1)) * 0.12;
  const config = useMemo(
    () => ({
      stiffness: Math.max(80, 300 - ringIndex * 60),
      damping: Math.max(6, 24 - ringIndex * 3),
    }),
    [ringIndex],
  );
  const spring = useSpring(
    config,
    (s) => {
      ref.current?.style.setProperty("--funnel-ring-scale", String(s));
    },
    1,
  );
  useIsomorphicLayoutEffect(() => {
    spring.set(hovered ? extraScale : 1);
  }, [hovered, extraScale]);

  return (
    <path
      ref={ref}
      className={`${CLASS}-ring ${CLASS}-ring--springy ${
        horizontal ? `${CLASS}-ring--bloom-y` : `${CLASS}-ring--bloom-x`
      }`}
      d={d}
      fill={color}
      fillOpacity={fillOpacity}
    />
  );
}
