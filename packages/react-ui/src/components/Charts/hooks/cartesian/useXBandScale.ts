import type { ScaleBand } from "d3-scale";
import { scaleBand } from "d3-scale";
import { useMemo } from "react";
import type { ChartData } from "../../types";

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
      .paddingInner(paddingInner ?? 0.2)
      .paddingOuter(paddingOuter ?? 0.1);
  }, [data, categoryKey, svgWidth, paddingInner, paddingOuter]);
};
