import { miniChartStyles } from "../shared/mini/miniChart.styles";

export const names = {
  root: "openui-mini-line-chart",
  svg: "openui-mini-line-chart-svg",
  line: "openui-mini-line-chart-line",
  point: "openui-mini-line-chart-point",
  isAnimationActive: { true: "openui-mini-line-chart--is-animation-active" },
} as const;

export const miniLineChartStyles = miniChartStyles;
