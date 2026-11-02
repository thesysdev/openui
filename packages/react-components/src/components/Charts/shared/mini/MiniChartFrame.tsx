"use client";

import { type MouseEventHandler, type ReactNode, useRef } from "react";
import { useContainerSize } from "../../hooks/core/useContainerSize";

/** Smallest frame side, in px; matches `min-width` / `min-height` in miniChart.scss. */
const MIN_MINI_SIZE = 100;

/**
 * The square frame every mini chart draws in: `size` sets width and height (default "100%"), kept square and at
 * least 100px each way. Measures itself and hands the svg size to `children`.
 */
export function MiniChartFrame({
  chart,
  size = "100%",
  className,
  svgClassName,
  onClick,
  children,
}: {
  chart: "area" | "bar" | "line";
  size?: number | string;
  className?: string;
  svgClassName: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children: (width: number, height: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // A number below the minimum draws at the minimum, as the CSS box does.
  const side = typeof size === "number" ? Math.max(size, MIN_MINI_SIZE) : size;
  const { width, height } = useContainerSize(ref, side, side);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: side, height: side }}
      data-clickable={onClick ? "" : undefined}
      onClick={onClick}
    >
      {width > 0 && height > 0 && (
        <svg
          className={svgClassName}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Mini ${chart} chart`}
        >
          {children(width, height)}
        </svg>
      )}
    </div>
  );
}
