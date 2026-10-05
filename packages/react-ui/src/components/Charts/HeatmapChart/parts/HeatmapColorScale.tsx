import React from "react";

import { numberTickFormatter } from "../../utils/styleUtils";

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
  classPrefix: string;
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
  ({ buckets, domainMin, domainMax, diverging, classPrefix }, ref) => (
    <div ref={ref} className={`${classPrefix}-color-scale`}>
      <span className={`${classPrefix}-color-scale-label`}>{numberTickFormatter(domainMin)}</span>
      <div
        className={`${classPrefix}-color-scale-ramp${
          diverging ? ` ${classPrefix}-color-scale-ramp--diverging` : ""
        }`}
      >
        {buckets.map((bucket, index) => (
          <span
            key={index}
            className={`${classPrefix}-color-scale-bucket`}
            style={{ backgroundColor: bucket.color }}
            title={`${numberTickFormatter(bucket.lo)} – ${numberTickFormatter(bucket.hi)}`}
          />
        ))}
      </div>
      <span className={`${classPrefix}-color-scale-label`}>{numberTickFormatter(domainMax)}</span>
    </div>
  ),
);

HeatmapColorScale.displayName = "HeatmapColorScale";
