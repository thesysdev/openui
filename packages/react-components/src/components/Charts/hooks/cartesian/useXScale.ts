import type { ScalePoint } from "d3-scale";
import { scalePoint } from "d3-scale";
import { useMemo } from "react";
import type { ChartData } from "../../types";

export const useXScale = (
  data: ChartData,
  categoryKey: string,
  svgWidth: number,
  widthOfGroup: number,
): ScalePoint<string> => {
  return useMemo(() => {
    return scalePoint<string>()
      .domain(data.map((d) => String(d[categoryKey])))
      .range([widthOfGroup / 2, svgWidth - widthOfGroup / 2])
      .padding(0);
  }, [data, categoryKey, svgWidth, widthOfGroup]);
};
