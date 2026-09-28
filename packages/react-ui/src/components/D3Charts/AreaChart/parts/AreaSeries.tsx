import type { ScaleLinear, ScalePoint } from "d3-scale";
import { type CurveFactory, curveLinear, curveMonotoneX, curveStepAfter } from "d3-shape";
import React, { useMemo, useRef } from "react";
import type { StackedData } from "../../hooks";
import { AnimatedPath } from "../../shared/cartesian/AnimatedPath";
import { AREA_STRIDE, buildAreaD, buildAreaEdgeD } from "../../shared/cartesian/seriesGeometry";
import { springPresets, useDataMorph, useIsomorphicLayoutEffect } from "../../shared/core/spring";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import { AreaChartVariant } from "../types";

const curveMap = {
  linear: curveLinear,
  natural: curveMonotoneX,
  step: curveStepAfter,
};

interface AreaSeriesProps {
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  variant: AreaChartVariant;
  stackedData: StackedData | null;
  categoryKey: string;
  transformedKeys: Record<string, string>;
  colors: Record<string, string>;
  chartId: string;
  isAnimationActive?: boolean;
}

export const AreaSeries: React.FC<AreaSeriesProps> = ({
  data,
  dataKeys,
  xScale,
  yScale,
  variant,
  stackedData,
  categoryKey,
  transformedKeys,
  colors,
  chartId,
  isAnimationActive,
}) => {
  // Fall back to the default curve for any variant not in the map — during
  // streaming the parser can hand us a placeholder (e.g. "") before the real
  // enum value arrives, and `curveMap[""]` would otherwise be `undefined`,
  // making d3-shape's `area().curve(undefined)` throw "curve is not a
  // function" on that transient first render. `natural` mirrors the chart's
  // own `variant = 'natural'` default.
  const curve = curveMap[variant] ?? curveMap.natural;

  // Target geometry per series: flat `[x, y0, y1, yEdge]` pixel scalars (see
  // seriesGeometry.ts for the layout) + the two paths built from them. React
  // commits these as the attributes; the morph only writes BETWEEN targets.
  const seriesGeom = useMemo(() => {
    if (stackedData) {
      return stackedData.map((series) => {
        const points = series as unknown as [number, number][];
        const values = new Float64Array(points.length * AREA_STRIDE);
        points.forEach((point, i) => {
          values[i * AREA_STRIDE] = xScale(String(data[i]![categoryKey])) ?? 0;
          values[i * AREA_STRIDE + 1] = yScale(point[0]);
          values[i * AREA_STRIDE + 2] = yScale(point[1]);
          // Stroke the VALUE edge: diverging negative segments carry it in
          // point[0] (point[1] is the edge closest to zero) — keying on
          // point[1] drew a -5 dip flat along the baseline.
          values[i * AREA_STRIDE + 3] = yScale(point[0] < 0 ? point[0] : point[1]);
        });
        return {
          key: series.key,
          values,
          areaPath: buildAreaD(values, curve),
          linePath: buildAreaEdgeD(values, curve),
        };
      });
    }
    return dataKeys.map((key) => {
      const values = new Float64Array(data.length * AREA_STRIDE);
      data.forEach((row, i) => {
        const y = yScale(Number(row[key]) || 0);
        values[i * AREA_STRIDE] = xScale(String(row[categoryKey])) ?? 0;
        values[i * AREA_STRIDE + 1] = yScale(0);
        values[i * AREA_STRIDE + 2] = y;
        values[i * AREA_STRIDE + 3] = y;
      });
      return {
        key,
        values,
        areaPath: buildAreaD(values, curve),
        linePath: buildAreaEdgeD(values, curve),
      };
    });
  }, [data, dataKeys, xScale, yScale, stackedData, categoryKey, curve]);

  return (
    <g className={`${CHART_CLASS_PREFIX}-area-chart-areas`}>
      {seriesGeom.map(({ key, values, areaPath, linePath }) => (
        <AreaSeriesItem
          key={key}
          values={values}
          areaPath={areaPath}
          linePath={linePath}
          curve={curve}
          color={colors[key] ?? "#000"}
          gradientId={`grad-${chartId}-${transformedKeys[key]}`}
          isAnimationActive={isAnimationActive}
        />
      ))}
    </g>
  );
};

/**
 * One series' fill + value-edge stroke under the spring data morph — same
 * design as LineSeriesItem (see there for the streaming rationale). ONE morph
 * drives both paths from the same scalars, so fill and stroke can never seam
 * apart mid-animation.
 */
function AreaSeriesItem({
  values,
  areaPath,
  linePath,
  curve,
  color,
  gradientId,
  isAnimationActive,
}: {
  values: Float64Array;
  areaPath: string;
  linePath: string;
  curve: CurveFactory;
  color: string;
  gradientId: string;
  isAnimationActive?: boolean;
}) {
  const areaRef = useRef<SVGPathElement | null>(null);
  const lineRef = useRef<SVGPathElement | null>(null);
  const curveRef = useRef(curve);
  curveRef.current = curve;

  const aim = useDataMorph(springPresets.dataMorph, (animated) => {
    areaRef.current?.setAttribute("d", buildAreaD(animated, curveRef.current));
    lineRef.current?.setAttribute("d", buildAreaEdgeD(animated, curveRef.current));
  });

  // Pre-paint so a mid-glide retarget restores the animated geometry before
  // the freshly committed target attributes can flash.
  useIsomorphicLayoutEffect(() => {
    aim(values, !isAnimationActive);
  }, [values, isAnimationActive, aim]);

  return (
    <g>
      <path
        ref={areaRef}
        className={`${CHART_CLASS_PREFIX}-area-chart-area-path${isAnimationActive ? ` ${CHART_CLASS_PREFIX}-area-chart-area-path--animated` : ""}`}
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      <AnimatedPath
        d={linePath}
        color={color}
        className={`${CHART_CLASS_PREFIX}-area-chart-area-line`}
        isAnimationActive={isAnimationActive}
        pathRef={lineRef}
      />
    </g>
  );
}
