import clsx from "clsx";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { useContainerSize } from "../../../hooks";
import { ChartLegend, ChartTooltip } from "../shared";
import { ChartEmpty } from "../shared/ChartEmpty";
import { FadeFollower } from "../shared/spring";
import { KIT_CHART_PREFIX } from "../utils/constants";
import { QuadrantAxes } from "./parts/QuadrantAxes";
import { QuadrantBubbles } from "./parts/QuadrantBubbles";
import {
  median,
  packBubbles,
  placeLabels,
  QUADRANT_COLORS,
  QUADRANT_ORDER,
  quadrantNameBoxes,
  quadrantOf,
  yAxisLeft,
  type Bubble,
} from "./quadrantGeometry";
import type { Quadrant, QuadrantChartProps } from "./types";

const P = `${KIT_CHART_PREFIX}-quadrant`;
const PAD = { left: 44, right: 20, top: 16, bottom: 40 };
const MIN_WIDTH = 320;
const MIN_RADIUS = 5;
const RADIUS_RANGE = 11;

/**
 * A quadrant chart: each point a bubble placed by two measures, sized by a
 * third, and split into four named quadrants (at the medians unless told
 * where). Amplitude's engagement matrix and the merchandiser's sell-through
 * against margin are both this chart. d3 linear scales place the bubbles, a
 * d3 sqrt scale sizes them by area, labels step aside to avoid each other,
 * and a spring data morph glides everything when a filter changes the data.
 */
export function QuadrantChart(props: QuadrantChartProps) {
  if (props.points.length === 0) {
    return <ChartEmpty prefix={P} className={props.className} />;
  }
  return <QuadrantChartImpl {...props} />;
}

function QuadrantChartImpl({
  points,
  x: xAxis,
  y: yAxis,
  quadrants: names,
  split,
  describe,
  sizeLabel,
  height = 340,
  isAnimationActive = true,
  className,
}: QuadrantChartProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640, height);
  const [hover, setHover] = useState<number | null>(null);
  const [resting, setResting] = useState(0);
  const onHover = useCallback((i: number) => {
    setHover(i);
    setResting(i);
  }, []);
  const width = Math.max(size.width, MIN_WIDTH);
  const right = width - PAD.right;
  const bottom = height - PAD.bottom;
  // Room on the left for the widest y tick label and the rotated axis title.
  const left = yAxisLeft(
    yAxis.ticks.map((t) => yAxis.format(t)),
    PAD.left,
  );

  const layout = useMemo(() => {
    const splitX = split?.x ?? median(points.map((p) => p.x));
    const splitY = split?.y ?? median(points.map((p) => p.y));
    const x = scaleLinear().domain(xAxis.domain).range([left, right]).clamp(true);
    const y = scaleLinear().domain(yAxis.domain).range([bottom, PAD.top]).clamp(true);
    const r = scaleSqrt()
      .domain([0, Math.max(...points.map((p) => p.size), 1)])
      .range([MIN_RADIUS, MIN_RADIUS + RADIUS_RANGE]);
    const quadrants: Quadrant[] = points.map((p) => quadrantOf(p, splitX, splitY));
    const bubbles: Bubble[] = points.map((p) => ({
      cx: x(p.x),
      cy: y(p.y),
      r: r(p.size),
      label: p.name,
    }));
    // Labels keep clear of the quadrant names and above the x tick labels.
    const labels = placeLabels(
      bubbles,
      { left, right: width - 2, top: 0, bottom: bottom + 2 },
      undefined,
      quadrantNameBoxes(names, { left, right, top: PAD.top, bottom }),
    );
    return {
      x,
      y,
      splitX,
      splitY,
      quadrants,
      bubbles,
      names: points.map((p) => p.name),
      colors: quadrants.map((q) => QUADRANT_COLORS[q]),
      anchors: labels.map((l) => l?.anchor),
      flat: packBubbles(bubbles, labels),
    };
  }, [points, xAxis.domain, yAxis.domain, split?.x, split?.y, names, width, left, right, bottom]);

  const { x, y, quadrants, bubbles } = layout;
  const hovered = hover != null ? points[hover] : undefined;
  const hoveredQuadrant = hover != null ? quadrants[hover]! : undefined;
  const ring = bubbles[Math.min(resting, bubbles.length - 1)]!;
  // Arrow keys walk the points left to right, as the other kit charts do.
  const byX = useMemo(
    () => bubbles.map((_, i) => i).sort((a, b) => bubbles[a]!.cx - bubbles[b]!.cx),
    [bubbles],
  );
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") setHover(null);
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const at = hover == null ? -1 : byX.indexOf(hover);
      const next =
        event.key === "ArrowRight"
          ? Math.min(byX.length - 1, at + 1)
          : Math.max(0, (at === -1 ? byX.length : at) - 1);
      onHover(byX[next]!);
    } else return;
    event.preventDefault();
  };

  return (
    <div className={clsx(P, className)}>
      <ChartLegend
        items={QUADRANT_ORDER.map((q) => ({
          name: names[q],
          color: QUADRANT_COLORS[q],
          kind: "rect" as const,
        }))}
      />
      <div
        ref={frameRef}
        className={`${P}-frame`}
        style={{ height }}
        tabIndex={0}
        role="img"
        aria-label={`${yAxis.title} against ${xAxis.title}, ${points.length} points. Use the arrow keys to read each point.`}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setHover(null)}
      >
        <svg width={width} height={height} className={`${P}-svg`}>
          <QuadrantAxes
            x={x}
            y={y}
            xAxis={xAxis}
            yAxis={yAxis}
            splitX={layout.splitX}
            splitY={layout.splitY}
            quadrants={names}
            left={left}
            right={right}
            top={PAD.top}
            bottom={bottom}
            height={height}
          />
          <QuadrantBubbles
            flat={layout.flat}
            names={layout.names}
            colors={layout.colors}
            anchors={layout.anchors}
            hover={hover}
            onHover={onHover}
            layoutKey={`${width}x${height}`}
            isAnimationActive={isAnimationActive}
          />
          <FadeFollower x={ring.cx} y={ring.cy} visible={hover != null}>
            <circle r={ring.r + 4} className={`${P}-ring`} />
          </FadeFollower>
        </svg>
        {hovered && hoveredQuadrant && (
          <ChartTooltip
            x={x(hovered.x)}
            y={Math.max(0, y(hovered.y) - 40)}
            width={width}
            title={hovered.name}
            rows={describe(hovered).map((row) => ({
              color: QUADRANT_COLORS[hoveredQuadrant],
              name: row.name,
              value: row.value,
              kind: "rect" as const,
            }))}
            footer={
              <>
                <span>{names[hoveredQuadrant]}</span>
                {hovered.change && (
                  <strong className={hovered.change.good ? "kit-text-good" : "kit-text-bad"}>
                    {hovered.change.text}
                  </strong>
                )}
              </>
            }
          />
        )}
      </div>
      {sizeLabel && <span className={`${P}-size`}>{sizeLabel}</span>}
    </div>
  );
}
