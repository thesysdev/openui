import type { ScaleLinear } from "d3-scale";
import { scaleLinear } from "d3-scale";
import { useMemo } from "react";
import type { ChartData } from "../../types";
import { computeYDomain, type StackOffset } from "../../utils/yDomain";

export const useYScale = (
  data: ChartData,
  dataKeys: string[],
  chartInnerHeight: number,
  stacked: boolean,
  stackOffset: StackOffset = "sign",
): ScaleLinear<number, number> => {
  return useMemo(() => {
    return scaleLinear()
      .domain(computeYDomain(data, dataKeys, stacked, stackOffset))
      .range([chartInnerHeight, 0])
      .nice();
  }, [data, dataKeys, stacked, stackOffset, chartInnerHeight]);
};
