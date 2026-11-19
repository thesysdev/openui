"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { names as pulseNames, skeletonPulseStyles } from "../SkeletonPulse/skeletonPulse.styles";
import { names, pieChartSkeletonStyles } from "./pieChartSkeleton.styles";
import { SkeletonBar } from "./SkeletonBar";
export function PieChartSkeleton({
  size = 200,
  legendItems = 4,
  variant = "pie",
  appearance = "circular",
}: {
  size?: number;
  legendItems?: number;
  variant?: "pie" | "donut";
  appearance?: "circular" | "semiCircular";
}) {
  const styles = pieChartSkeletonStyles;
  const pulse = skeletonPulseStyles;
  const isSemi = appearance === "semiCircular";
  const chartClass = clsx(styles.shape, names.shape, pulse.root, pulseNames.root);

  const chartHeight = isSemi ? size / 2 : size;

  return (
    <div
      className={clsx(
        styles.root,
        styles.variant[variant],
        styles.appearance[appearance],
        names.root,
        names.variant[variant],
        names.appearance[appearance],
      )}
    >
      <div className={clsx(styles.container, names.container)}>
        <div
          className={chartClass}
          style={
            {
              "--_openui-pie-chart-skeleton-shape-width": `${size}px`,
              "--_openui-pie-chart-skeleton-shape-height": `${chartHeight}px`,
            } as CSSProperties
          }
        />
      </div>
      <div className={clsx(styles.legend, names.legend)}>
        {Array.from({ length: legendItems }, (_, i) => (
          <div key={i} className={clsx(styles.legendItem, names.legendItem)}>
            <div className={clsx(styles.legendDot, names.legendDot, pulse.root, pulseNames.root)} />
            <SkeletonBar height="12px" width={`${50 + ((i * 15) % 40)}%`} />
          </div>
        ))}
      </div>
    </div>
  );
}
