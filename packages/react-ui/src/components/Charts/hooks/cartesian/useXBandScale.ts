import type { ScaleBand } from "d3-scale";
import { scaleBand } from "d3-scale";
import { useMemo } from "react";
import type { ChartData } from "../../types";

/** Default gap between bands, as a share of each category's step. */
export const BAND_PADDING_INNER = 0.2;
/** Default space before the first and after the last band, as a share of a step. */
export const BAND_PADDING_OUTER = 0.1;

export const useXBandScale = (
  data: ChartData,
  categoryKey: string,
  svgWidth: number,
  paddingInner?: number,
  paddingOuter?: number,
): ScaleBand<string> => {
  return useMemo(() => {
    return scaleBand<string>()
      .domain(data.map((d) => String(d[categoryKey])))
      .range([0, svgWidth])
      .paddingInner(paddingInner ?? BAND_PADDING_INNER)
      .paddingOuter(paddingOuter ?? BAND_PADDING_OUTER);
  }, [data, categoryKey, svgWidth, paddingInner, paddingOuter]);
};
