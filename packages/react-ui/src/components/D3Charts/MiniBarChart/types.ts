export type MiniBarChartData = Array<number> | Array<{ value: number; label?: string }>;

export interface MiniBarChartProps {
  data: MiniBarChartData;
  customPalette?: string[];
  /** Corner radius of each bar's outer end. Default 1. */
  radius?: number;
  /** Fade the chart in on mount. Default false; printing always disables it. */
  isAnimationActive?: boolean;
  /** Called with the click event when the chart is clicked. */
  onBarsClick?: (data: any) => void;
  /** Width and height (the chart stays square, at least 100px). Default "100%". */
  size?: number | string;
  className?: string;
  /** Single color override; `customPalette` wins when both are set. */
  barColor?: string;
}
