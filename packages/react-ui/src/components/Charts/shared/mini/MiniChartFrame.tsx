import clsx from "clsx";
import { type MouseEventHandler, type ReactNode, useRef } from "react";
import { useContainerSize } from "../../hooks/core/useContainerSize";
import { CHART_CLASS_PREFIX } from "../../utils/constants";

/**
 * The square frame every mini chart draws in: `size` sets width and height (default "100%"), kept square and at
 * least 100px each way. Measures itself and hands the svg size to `children`.
 */
export function MiniChartFrame({
  chart,
  size = "100%",
  className,
  onClick,
  children,
}: {
  chart: "area" | "bar" | "line";
  size?: number | string;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children: (width: number, height: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(ref, size, size);

  return (
    <div
      ref={ref}
      className={clsx(
        `${CHART_CLASS_PREFIX}-mini-chart`,
        `${CHART_CLASS_PREFIX}-mini-${chart}-chart-container`,
        onClick && `${CHART_CLASS_PREFIX}-mini-chart--clickable`,
        className,
      )}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {width > 0 && height > 0 && (
        <svg
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
