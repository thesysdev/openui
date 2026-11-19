import { miniChartStyles } from "../shared/mini/miniChart.styles";

export const names = {
  root: "openui-mini-area-chart",
  svg: "openui-mini-area-chart-svg",
  area: "openui-mini-area-chart-area",
  line: "openui-mini-area-chart-line",
  point: "openui-mini-area-chart-point",
  defs: "openui-mini-area-chart-defs",
  gradient: "openui-mini-area-chart-gradient",
  stopStart: "openui-mini-area-chart-stop-start",
  stopEnd: "openui-mini-area-chart-stop-end",
  isAnimationActive: { true: "openui-mini-area-chart--is-animation-active" },
} as const;

export const miniAreaChartStyles = miniChartStyles;
