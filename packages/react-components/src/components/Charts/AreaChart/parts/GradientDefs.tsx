"use client";

import React from "react";
import { ClipDefs } from "../../shared/cartesian/ClipDefs";
import { names } from "../areaChart.styles";

const GRADIENT_TOP_OPACITY = 0.6;
const GRADIENT_BOTTOM_OPACITY = 0;

interface GradientDefsProps {
  dataKeys: string[];
  transformedKeys: Record<string, string>;
  colors: Record<string, string>;
  chartId: string;
  chartWidth: number;
  chartHeight: number;
  /** Series rendered entirely below zero — their fade direction flips. */
  negativeKeys?: Set<string>;
}

export const GradientDefs: React.FC<GradientDefsProps> = ({
  dataKeys,
  transformedKeys,
  colors,
  chartId,
  chartWidth,
  chartHeight,
  negativeKeys,
}) => {
  return (
    <defs className={names.defs}>
      <ClipDefs
        className={names.clip}
        rectClassName={names.clipRect}
        chartId={chartId}
        chartWidth={chartWidth}
        chartHeight={chartHeight}
      />
      {dataKeys.map((key) => {
        const transformedKey = transformedKeys[key];
        const color = colors[key] ?? "#000";
        // All-negative bands hang below zero: flip so the strong end sits at
        // the data edge (bottom) and the fade reaches the zero line (top).
        const flip = negativeKeys?.has(key) ?? false;
        return (
          <linearGradient
            className={names.gradient}
            key={key}
            id={`grad-${chartId}-${transformedKey}`}
            x1="0"
            y1={flip ? "1" : "0"}
            x2="0"
            y2={flip ? "0" : "1"}
          >
            <stop
              className={names.stop}
              offset="5%"
              stopColor={color}
              stopOpacity={GRADIENT_TOP_OPACITY}
            />
            <stop
              className={names.stop}
              offset="95%"
              stopColor={color}
              stopOpacity={GRADIENT_BOTTOM_OPACITY}
            />
          </linearGradient>
        );
      })}
    </defs>
  );
};
