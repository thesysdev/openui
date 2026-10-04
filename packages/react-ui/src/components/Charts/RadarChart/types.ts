import type { ChartData } from "../types";

export type RadarChartData = ChartData;

export interface RadarChartProps<T extends RadarChartData> {
  data: T;
  categoryKey: keyof T[number];
  customPalette?: string[];
  gridShape?: "circle" | "polygon";
  gridLevels?: number;
  grid?: boolean;
  legend?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  /**
   * Play the entrance animation. Gates the entrance ONLY — any hover or
   * data-update motion is independent of this flag, and printing always
   * disables it.
   * Default false (streaming-safe: marks mounted while data streams in don't
   * replay staggered entrances).
   */
  isAnimationActive?: boolean;
  /**
   * `"line"` (default): series outlines only. `"area"`: outlines filled at
   * `areaOpacity`.
   */
  variant?: "line" | "area";
  /** Fill opacity of the `"area"` variant. Default 0.2. */
  areaOpacity?: number;
  /** Vertex dots on every series. Default false. */
  showDots?: boolean;
  dotRadius?: number;
  /** Explicit fill opacity for every variant; overrides `variant` / `areaOpacity`. */
  fillOpacity?: number;
  maxChartSize?: number;
  minChartSize?: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  className?: string;
  onClick?: (row: T[number], index: number) => void;
}
