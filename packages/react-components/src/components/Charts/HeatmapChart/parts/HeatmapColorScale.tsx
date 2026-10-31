"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import React from "react";
import { numberTickFormatter } from "../../utils/styleUtils";
import { heatmapChartStyles, names } from "../heatmapChart.styles";

export interface HeatmapColorScaleBucket {
  color: string;
  /** Bucket bounds, derived by index from thresholds() + the domain. */
  lo: number;
  hi: number;
}

interface HeatmapColorScaleProps {
  buckets: HeatmapColorScaleBucket[];
  domainMin: number;
  domainMax: number;
  /** Diverging ramps get a zero notch at the strip's center. */
  diverging: boolean;
}

/**
 * The value→color key: a non-interactive bucket strip with the domain's
 * endpoints labeled. Each swatch is one quantize bucket and carries its exact
 * value range as a native title — honest by construction (the buckets come
 * from invertExtent, never re-derived). HTML below the svg (like the row
 * legend) so it survives print and needs no plot space; the orchestrator
 * measures its height and deducts it from the grid in fit mode.
 *
 * This exists because the tooltip is the only other value readout and it's
 * mouse-only: on touch and in print/PDF a heatmap without this strip cannot
 * be decoded at all.
 */
export const HeatmapColorScale = React.forwardRef<HTMLDivElement, HeatmapColorScaleProps>(
  ({ buckets, domainMin, domainMax, diverging }, ref) => {
    const styles = heatmapChartStyles;
    return (
      <div ref={ref} className={clsx(styles.colorScale, names.colorScale)}>
        <span className={clsx(styles.colorScaleLabel, names.colorScaleLabel)}>
          {numberTickFormatter(domainMin)}
        </span>
        <div
          className={clsx(
            styles.colorScaleRamp,
            names.colorScaleRamp,
            diverging && styles.colorScaleRampRampModeDiverging,
            diverging
              ? names.colorScaleRampRampModeDiverging
              : names.colorScaleRampRampModeSequential,
          )}
        >
          {buckets.map((bucket, index) => (
            <span
              key={index}
              className={clsx(styles.colorScaleBucket, names.colorScaleBucket)}
              style={
                {
                  "--_openui-heatmap-chart-color-scale-bucket-background-color": bucket.color,
                } as CSSProperties
              }
              title={`${numberTickFormatter(bucket.lo)} – ${numberTickFormatter(bucket.hi)}`}
            />
          ))}
        </div>
        <span className={clsx(styles.colorScaleLabel, names.colorScaleLabel)}>
          {numberTickFormatter(domainMax)}
        </span>
      </div>
    );
  },
);

HeatmapColorScale.displayName = "HeatmapColorScale";
