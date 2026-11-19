export type MiniAreaChartData = Array<number> | Array<{ value: number; label?: string }>;

export interface MiniAreaChartProps {
  data: MiniAreaChartData;
  customPalette?: string[];
  variant?: "linear" | "natural" | "step";
  /** Fill opacity when `useGradient` is false. Default 0.5. */
  opacity?: number;
  /** Fade the chart in on mount. Default false; printing always disables it. */
  isAnimationActive?: boolean;
  /** Called with the click event when the chart is clicked. */
  onAreaClick?: (data: any) => void;
  /** Width and height (the chart stays square, at least 100px). Default "100%". */
  size?: number | string;
  className?: string;
  /** Single color override; `customPalette` wins when both are set. */
  areaColor?: string;
  /** Fade the fill from the line down. Default true. */
  useGradient?: boolean;
}
