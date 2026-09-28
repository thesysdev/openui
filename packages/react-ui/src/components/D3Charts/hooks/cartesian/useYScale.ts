import type { ScaleLinear } from "d3-scale";
import { scaleLinear } from "d3-scale";
import { useMemo } from "react";
import type { ChartData } from "../../types";
import { computeYDomain } from "../../utils/yDomain";

export const useYScale = (
  data: ChartData,
  dataKeys: string[],
  chartInnerHeight: number,
  stacked: boolean,
): ScaleLinear<number, number> => {
  return useMemo(() => {
    return scaleLinear()
      .domain(computeYDomain(data, dataKeys, stacked))
      .range([chartInnerHeight, 0])
      .nice();
  }, [data, dataKeys, stacked, chartInnerHeight]);
};
