import type { PaletteName } from "../utils/paletteUtils";

export interface ScatterPoint {
  x: number;
  y: number;
  [key: string]: string | number | undefined;
}

export interface ScatterDataset {
  name: string;
  data: ScatterPoint[];
}

export type D3ScatterChartData = ScatterDataset[];

export interface HoveredScatterPoint {
  datasetIndex: number;
  pointIndex: number;
  point: ScatterPoint;
  datasetName: string;
}

export interface D3ScatterChartProps {
  data: D3ScatterChartData;
  theme?: PaletteName;
  customPalette?: string[];
  grid?: boolean;
  verticalGrid?: boolean;
  legend?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  isAnimationActive?: boolean;
  dotRadius?: number;
  className?: string;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  onClick?: (
    point: ScatterPoint,
    datasetName: string,
    datasetIndex: number,
    pointIndex: number,
  ) => void;
}
