import type { ScatterChartData, ScatterPoint } from "../types";

/**
 * Extracts dataset names from scatter chart data
 * @param data - The scatter chart data (array of datasets)
 * @returns Array of dataset names
 */
export const getScatterDatasets = (data: ScatterChartData): string[] => {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data.map((dataset) => dataset.name);
};

/**
 * Flattens scatter datasets into one list of points
 * @param data - The scatter chart data (array of datasets)
 * @param datasets - Array of dataset names to include
 * @param colors - Array of colors for datasets
 * @returns Flattened array of all points with color and dataset info
 */
export const transformScatterData = (
  data: ScatterChartData,
  datasets: string[],
  colors: string[],
) => {
  // Guard against undefined or null data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const datasetColors: { [key: string]: string } = {};
  datasets.forEach((ds, i) => {
    datasetColors[ds] = colors[i] ?? "transparent";
  });

  // Flatten all datasets into a single array with dataset info
  const transformedPoints: Array<ScatterPoint & { color: string; dataset: string }> = [];

  data.forEach((dataset) => {
    // Use only palette colors, ignore any hardcoded colors in datasets
    const color = datasetColors[dataset.name] || "transparent";

    dataset.data.forEach((point) => {
      transformedPoints.push({
        ...point,
        x: Number(point.x),
        y: Number(point.y),
        z: point["z"] ? Number(point["z"]) : undefined,
        color,
        dataset: dataset.name,
      });
    });
  });

  return transformedPoints;
};

/**
 * Calculates the domain for scatter chart axes
 * @param data - The scatter chart data (array of datasets)
 * @param axis - Which axis ('x' or 'y')
 * @returns Domain array [min, max] with padding
 */
export const calculateScatterDomain = (
  data: ScatterChartData,
  axis: "x" | "y",
): [number, number] => {
  if (!data || !Array.isArray(data) || !data.length) return [0, 100];

  // Flatten all data points from all datasets
  const allPoints = data.flatMap((dataset) => dataset.data);

  const values = allPoints.map((point) => Number(point[axis])).filter((val) => !isNaN(val));
  if (!values.length) return [0, 100];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1; // 10% padding

  return [Math.max(0, min - padding), max + padding];
};

/**
 * Formats scatter chart data for tooltip display
 * @param dataKey - The data key being displayed
 * @param value - The value to format
 * @param unit - Optional unit to append
 * @returns Formatted string
 */
export const formatScatterTooltipValue = (value: number | string, unit?: string): string => {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;
  return unit ? `${formattedValue} ${unit}` : formattedValue;
};
