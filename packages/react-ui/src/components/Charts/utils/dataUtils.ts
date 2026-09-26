import { ChartConfig } from "../Charts";
import { PieChartData } from "../PieChart";
import { RadialChartData } from "../RadialChart";
import { LegendItem } from "../types";

// Shared empty array reference so that normalizing nullish data does not
// allocate a new array on every render (a fresh `[]` would change identity
// and defeat the charts' `useMemo`/`React.memo` optimizations).
const EMPTY_CHART_DATA: readonly never[] = [];

/**
 * Normalizes a chart's `data` prop to always be an array.
 *
 * While generative UI is streaming, `data` can momentarily be `null` or
 * `undefined` before the full payload arrives. Passing that straight into the
 * chart internals throws (e.g. `getDataKeys`, `data.length`, `[...data]`).
 * This guard falls back to a stable shared empty array so charts render an
 * empty state instead of crashing.
 *
 * @param data - The raw `data` prop, which may be nullish mid-stream.
 * @returns The original array, or a stable empty array when `data` is nullish.
 */
export const normalizeChartData = <T extends readonly unknown[]>(data: T | null | undefined): T => {
  return (Array.isArray(data) ? data : EMPTY_CHART_DATA) as T;
};

/**
 * This function returns the data keys for the chart, used for the data keys of the chart.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @returns The data keys for the chart.
 */
export const getDataKeys = (
  data: Array<Record<string, string | number>> | null | undefined,
  categoryKey: string,
): string[] => {
  return Object.keys(data?.[0] || {}).filter((key) => key !== categoryKey);
};

/**
 * This function returns the chart configuration object, used for the chart configuration object of the chart.
 * @param dataKeys - The data keys for the chart.
 * @param colors - The colors for the chart.
 * @param transformedKeys - The transformed keys for the chart.
 * @param secondaryColors - The secondary colors for the chart (optional).
 * @param icons - The icons for the chart (optional).
 * @returns The chart configuration object for the chart.
 */
export const get2dChartConfig = (
  dataKeys: string[],
  colors: string[],
  transformedKeys: Record<string, string>,
  secondaryColors?: string[],
  icons?: Partial<Record<string, React.ComponentType>>,
): ChartConfig => {
  return dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        icon: icons?.[key],
        color: colors[index],
        secondaryColor: secondaryColors?.[index] || colors[dataKeys.length - index - 1],
        transformed: transformedKeys[key],
      },
    }),
    {},
  );
};

type CategoricalChartData = RadialChartData | PieChartData;

export const getCategoricalChartConfig = <T extends CategoricalChartData>(
  data: T,
  categoryKey: keyof T[number],
  colors: string[], // Change this from 'theme: string' to 'colors: string[]'
  transformedKeys: Record<string, string>,
): ChartConfig => {
  return data.reduce<ChartConfig>((config, item, index) => {
    const originalKey = String(item[categoryKey]);
    const transformedKey = `key-${transformedKeys[originalKey] ?? originalKey}`;
    return {
      ...config,
      [transformedKey]: {
        label: String(item[categoryKey as string]),
        color: colors[index],
        secondaryColor: colors[data.length - index - 1], // Add secondary color for gradient effect
      },
    };
  }, {});
};

/**
 * This function returns the legend items for the chart, used for the legend items of the chart.
 * @param dataKeys - The data keys for the chart.
 * @param colors - The colors for the chart.
 * @param icons - The icons for the chart.
 * @returns The legend items for the chart.
 */

export const getLegendItems = (
  dataKeys: string[],
  colors: string[],
  icons?: Partial<Record<string, React.ComponentType>>,
): LegendItem[] => {
  return dataKeys.map((key, index) => ({
    key,
    label: key,
    color: colors[index] ?? "#000000", // Fallback color if undefined
    icon: icons?.[key] as React.ComponentType | undefined,
  }));
};

/**
 * This function returns the color value for a specific data key based on its position in the dataKeys array.
 * Use this instead of payload.fill to ensure consistent color mapping.
 * @param dataKey - The data key to get the color for.
 * @param dataKeys - The array of all data keys in the chart.
 * @param colors - The array of colors corresponding to the data keys.
 * @returns The color value for the specified data key.
 */
export const getColorForDataKey = (
  dataKey: string,
  dataKeys: string[],
  colors: string[],
): string => {
  const index = dataKeys.indexOf(dataKey);
  return colors[index] ?? "#000000"; // Fallback color if dataKey not found or color undefined
};
