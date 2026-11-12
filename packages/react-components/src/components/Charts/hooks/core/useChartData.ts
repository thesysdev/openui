import React, { useMemo } from "react";

import { get2dChartConfig, getDataKeys, getLegendItems } from "../../utils/dataUtils";
import { useChartPalette } from "../../utils/paletteUtils";
import { useSeriesVisibility } from "./useSeriesVisibility";
import { useTransformedKeys } from "./useTransformedKeys";

import type { ChartColorPalette } from "../../../ThemeProvider";
import type { ChartData } from "../../types";

export interface UseChartDataParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
}

export function useChartData<T extends ChartData>({
  data,
  categoryKey,
  themePaletteName,
  customPalette,
  icons,
}: UseChartDataParams<T>) {
  const catKey = String(categoryKey);
  const allDataKeys = useMemo(() => getDataKeys(data, catKey), [data, catKey]);

  const { hiddenSeries, toggleSeries } = useSeriesVisibility(allDataKeys);
  const dataKeys = useMemo(
    () => allDataKeys.filter((k) => !hiddenSeries.has(k)),
    [allDataKeys, hiddenSeries],
  );

  const colors = useChartPalette({
    customPalette,
    themePaletteName,
    dataLength: allDataKeys.length,
  });

  const transformedKeys = useTransformedKeys(allDataKeys);

  const chartConfig = useMemo(
    () => get2dChartConfig(allDataKeys, colors, transformedKeys, icons),
    [allDataKeys, colors, transformedKeys, icons],
  );

  const colorMap = useMemo(() => {
    return allDataKeys.reduce(
      (map, key) => {
        map[key] = chartConfig[key]?.color ?? "#000";
        return map;
      },
      {} as Record<string, string>,
    );
  }, [allDataKeys, chartConfig]);

  const chartStyle = useMemo(() => {
    return allDataKeys.reduce(
      (styles, key) => {
        const transformedKey = transformedKeys[key];
        const color = chartConfig[key]?.color;
        return {
          ...styles,
          [`--color-${transformedKey}`]: color,
        };
      },
      {} as Record<string, string | undefined>,
    );
  }, [allDataKeys, transformedKeys, chartConfig]);

  const legendItems = useMemo(
    () => getLegendItems(allDataKeys, colors, icons),
    [allDataKeys, colors, icons],
  );

  return {
    catKey,
    allDataKeys,
    dataKeys,
    hiddenSeries,
    toggleSeries,
    colors,
    transformedKeys,
    chartConfig,
    colorMap,
    chartStyle,
    legendItems,
  };
}
