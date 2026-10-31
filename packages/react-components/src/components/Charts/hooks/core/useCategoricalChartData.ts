import { useMemo } from "react";

import type { ChartColorPalette } from "../../../ThemeProvider";
import type { ChartData, LegendItem } from "../../types";
import { useChartPalette } from "../../utils/paletteUtils";
import { sortByValueDescending } from "../../utils/polarUtils";
import { useSeriesVisibility } from "./useSeriesVisibility";

export interface CategoricalSlice {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface UseCategoricalChartDataParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  format?: "number" | "percentage";
}

export function useCategoricalChartData<T extends ChartData>({
  data,
  categoryKey,
  dataKey,
  themePaletteName,
  customPalette,
  format = "number",
}: UseCategoricalChartDataParams<T>) {
  const catKey = String(categoryKey);
  const valKey = String(dataKey);

  const sortedData = useMemo(() => sortByValueDescending(data, valKey), [data, valKey]);

  // Slices toggle by LABEL through the same machinery series use — one
  // last-visible guard implementation instead of two drifting copies.
  const sliceLabels = useMemo(
    () => sortedData.map((row) => String(row[catKey])),
    [sortedData, catKey],
  );
  const { hiddenSeries: hiddenSlices, toggleSeries: toggleSlice } =
    useSeriesVisibility(sliceLabels);

  const colors = useChartPalette({
    customPalette,
    themePaletteName,
    dataLength: sortedData.length,
  });

  const total = useMemo(
    () =>
      sortedData.reduce((sum, row) => {
        if (hiddenSlices.has(String(row[catKey]))) return sum;
        return sum + (Number(row[valKey]) || 0);
      }, 0),
    [sortedData, catKey, valKey, hiddenSlices],
  );

  const slices: CategoricalSlice[] = useMemo(
    () =>
      sortedData.map((row, i) => {
        const value = Number(row[valKey]) || 0;
        return {
          label: String(row[catKey]),
          value,
          color: colors[i] ?? "#000",
          percentage: total > 0 ? (value / total) * 100 : 0,
        };
      }),
    [sortedData, catKey, valKey, colors, total],
  );

  const legendItems: LegendItem[] = useMemo(
    () =>
      slices.map((s) => ({
        key: s.label,
        label: s.label,
        color: s.color,
        percentage: format === "percentage" ? s.percentage : undefined,
      })),
    [slices, format],
  );

  const chartStyle = useMemo(() => {
    return slices.reduce(
      (styles, s, i) => ({
        ...styles,
        [`--slice-color-${i}`]: s.color,
      }),
      {} as Record<string, string>,
    );
  }, [slices]);

  return {
    catKey,
    valKey,
    sortedData,
    slices,
    total,
    hiddenSlices,
    toggleSlice,
    legendItems,
    chartStyle,
  };
}
