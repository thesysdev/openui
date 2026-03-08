import type { ChartData } from "../types";
import type { PaletteName } from "../utils/paletteUtils";

export type D3RadarChartData = ChartData;

export interface D3RadarChartProps<T extends D3RadarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  gridShape?: "circle" | "polygon";
  gridLevels?: number;
  grid?: boolean;
  legend?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showDots?: boolean;
  dotRadius?: number;
  fillOpacity?: number;
  maxChartSize?: number;
  minChartSize?: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  className?: string;
  onClick?: (row: T[number], index: number) => void;
}
