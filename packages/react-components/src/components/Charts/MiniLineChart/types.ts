export type MiniLineChartData = Array<number> | Array<{ value: number; label?: string }>;

export interface MiniLineChartProps {
  data: MiniLineChartData;
  customPalette?: string[];
  variant?: "linear" | "natural" | "step";
  /** Line width in px. Default 2. */
  strokeWidth?: number;
  /** Fade the chart in on mount. Default false; printing always disables it. */
  isAnimationActive?: boolean;
  /** Called with the click event when the chart is clicked. */
  onLineClick?: (data: any) => void;
  /** Width and height (the chart stays square, at least 100px). Default "100%". */
  size?: number | string;
  className?: string;
  /** Single color override; `customPalette` wins when both are set. */
  lineColor?: string;
}
