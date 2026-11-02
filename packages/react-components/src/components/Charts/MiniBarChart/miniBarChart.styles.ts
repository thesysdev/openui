import { miniChartStyles } from "../shared/mini/miniChart.styles";

export const names = {
  root: "openui-mini-bar-chart",
  svg: "openui-mini-bar-chart-svg",
  barGroup: "openui-mini-bar-chart-bar-group",
  bar: "openui-mini-bar-chart-bar",
  innerLine: "openui-mini-bar-chart-inner-line",
  isAnimationActive: { true: "openui-mini-bar-chart--is-animation-active" },
} as const;

export const miniBarChartStyles = miniChartStyles;
