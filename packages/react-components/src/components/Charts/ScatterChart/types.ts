export interface ScatterPoint {
  x: number;
  y: number;
  [key: string]: string | number | undefined;
}

export interface ScatterDataset {
  name: string;
  data: ScatterPoint[];
}

export type ScatterChartData = ScatterDataset[];

export interface HoveredScatterPoint {
  datasetIndex: number;
  pointIndex: number;
  point: ScatterPoint;
  datasetName: string;
}

export interface ScatterChartProps {
  data: ScatterChartData;
  /** Point field that sets the horizontal position. Default `"x"`. */
  xAxisDataKey?: string;
  /** Point field that sets the vertical position. Default `"y"`. */
  yAxisDataKey?: string;
  customPalette?: string[];
  grid?: boolean;
  verticalGrid?: boolean;
  /**
   * Show the legend. NOTE: `xAxisLabel`/`yAxisLabel` render inside the legend
   * strip, so `legend={false}` hides them too.
   */
  legend?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  /**
   * Play the entrance animation. Gates the entrance ONLY — any hover or
   * data-update motion is independent of this flag, and printing always
   * disables it.
   * Default false (streaming-safe: marks mounted while data streams in don't
   * replay staggered entrances).
   */
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
