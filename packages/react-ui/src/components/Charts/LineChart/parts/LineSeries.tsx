import type { ScaleLinear, ScalePoint } from "d3-scale";
import type { CurveFactory } from "d3-shape";
import React, { useMemo, useRef } from "react";
import { AnimatedPath } from "../../shared/cartesian/AnimatedPath";
import { buildLineD, LINE_STRIDE, seriesCurve } from "../../shared/cartesian/seriesGeometry";
import { springPresets, useDataMorph, useIsomorphicLayoutEffect } from "../../shared/core/spring";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import type { LineChartVariant } from "../types";

interface LineSeriesProps {
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  variant: LineChartVariant;
  categoryKey: string;
  colors: Record<string, string>;
  showDots: boolean;
  dotRadius: number;
  isAnimationActive?: boolean;
}

export const LineSeries: React.FC<LineSeriesProps> = ({
  data,
  dataKeys,
  xScale,
  yScale,
  variant,
  categoryKey,
  colors,
  showDots,
  dotRadius,
  isAnimationActive,
}) => {
  const curve = seriesCurve(variant);

  // Target geometry per series: flat point pixels + the d built from them.
  // React commits these as the attributes (SSR/print/snap correct by
  // construction); the morph only ever writes BETWEEN target states.
  const seriesGeom = useMemo(() => {
    return dataKeys.map((key) => {
      const points = new Float64Array(data.length * LINE_STRIDE);
      data.forEach((row, i) => {
        points[i * LINE_STRIDE] = xScale(String(row[categoryKey])) ?? 0;
        points[i * LINE_STRIDE + 1] = yScale(Number(row[key]) || 0);
      });
      return { key, points, linePath: buildLineD(points, curve) };
    });
  }, [data, dataKeys, xScale, yScale, categoryKey, curve]);

  return (
    <g className={`${CHART_CLASS_PREFIX}-line-chart-lines`}>
      {seriesGeom.map(({ key, points, linePath }) => (
        <LineSeriesItem
          key={key}
          points={points}
          linePath={linePath}
          curve={curve}
          color={colors[key] ?? "#000"}
          showDots={showDots}
          dotRadius={dotRadius}
          isAnimationActive={isAnimationActive}
        />
      ))}
    </g>
  );
};

/**
 * One series' line (+ optional dots) under the spring data morph. When target
 * geometry changes with `isAnimationActive` on, the point vector springs from
 * its live position/velocity and `d` (and dot cx/cy) regenerate per ticker
 * tick — per-frame data churn (streaming) retargets the spring mid-flight and
 * converges, where the removed CSS `transition: d` restarted at progress 0 on
 * every write and pinned the rendered geometry. With the flag off (the
 * default, and every c1 surface) there is no morph at all: React's own
 * attribute commit IS the snap. The dots ride the same scalars, so stroke and
 * dots can never seam apart.
 */
function LineSeriesItem({
  points,
  linePath,
  curve,
  color,
  showDots,
  dotRadius,
  isAnimationActive,
}: {
  points: Float64Array;
  linePath: string;
  curve: CurveFactory;
  color: string;
  showDots: boolean;
  dotRadius: number;
  isAnimationActive?: boolean;
}) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const dotsRef = useRef<SVGGElement | null>(null);
  const curveRef = useRef(curve);
  curveRef.current = curve;

  const aim = useDataMorph(springPresets.dataMorph, (values) => {
    pathRef.current?.setAttribute("d", buildLineD(values, curveRef.current));
    const dots = dotsRef.current?.children;
    if (dots) {
      const n = Math.min(dots.length, Math.floor(values.length / LINE_STRIDE));
      for (let i = 0; i < n; i++) {
        const dot = dots[i] as SVGCircleElement;
        dot.setAttribute("cx", String(values[i * LINE_STRIDE]));
        dot.setAttribute("cy", String(values[i * LINE_STRIDE + 1]));
      }
    }
  });

  // Pre-paint so a mid-glide retarget restores the animated geometry before
  // the freshly committed target attributes can flash.
  useIsomorphicLayoutEffect(() => {
    aim(points, !isAnimationActive);
  }, [points, isAnimationActive, aim]);

  return (
    <g>
      <AnimatedPath
        d={linePath}
        color={color}
        className={`${CHART_CLASS_PREFIX}-line-chart-line`}
        isAnimationActive={isAnimationActive}
        pathRef={pathRef}
      />
      {showDots && (
        <g ref={dotsRef}>
          {Array.from({ length: points.length / LINE_STRIDE }, (_, i) => (
            <circle
              key={i}
              cx={points[i * LINE_STRIDE]}
              cy={points[i * LINE_STRIDE + 1]}
              r={dotRadius}
              fill={color}
              className={`${CHART_CLASS_PREFIX}-line-chart-dot`}
            />
          ))}
        </g>
      )}
    </g>
  );
}
