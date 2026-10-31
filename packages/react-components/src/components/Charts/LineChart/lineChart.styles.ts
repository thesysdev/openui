import { css } from "../../../styles/css";

import { drawLineAnimation } from "../shared/animations/drawLine.styles";
import {
  activeDotInner,
  activeDotOuter,
  cartesianContainer,
  cartesianContainerInner,
  cartesianMainContainer,
  cartesianYAxisContainer,
  crosshairLine,
  gridLine,
  zeroGridLine,
} from "../shared/chartBaseDeclarations";
import { svgTickLabel } from "../shared/chartTypography";

export const names = {
  root: "openui-line-chart",
  variant: {
    linear: "openui-line-chart--variant-linear",
    natural: "openui-line-chart--variant-natural",
    step: "openui-line-chart--variant-step",
  },
  containerInner: "openui-line-chart-container-inner",
  yAxisContainer: "openui-line-chart-y-axis-container",
  mainContainer: "openui-line-chart-main-container",
  grid: "openui-line-chart-grid",
  gridLine: "openui-line-chart-grid-line",
  yAxis: "openui-line-chart-y-axis",
  yTick: "openui-line-chart-y-tick",
  xAxis: "openui-line-chart-x-axis",
  xTick: "openui-line-chart-x-tick",
  xTickAngled: "openui-line-chart-x-tick-angled",
  crosshair: "openui-line-chart-crosshair",
  crosshairLine: "openui-line-chart-crosshair-line",
  activeDotOuter: "openui-line-chart-active-dot-outer",
  activeDotInner: "openui-line-chart-active-dot-inner",
  lines: "openui-line-chart-lines",
  dot: "openui-line-chart-dot",
  line: "openui-line-chart-line",
  lineAnimated: { true: "openui-line-chart-line--is-animation-active" },
  svg: "openui-line-chart-svg",
  group: "openui-line-chart-group",
  hitTarget: "openui-line-chart-hit-target",
  tickLine: "openui-line-chart-tick-line",
  defs: "openui-line-chart-defs",
  clip: "openui-line-chart-clip",
  clipRect: "openui-line-chart-clip-rect",
  highlight: "openui-line-chart-highlight",
} as const;

export const lineChartStyles = {
  svg: css`
    &[data-overflow="visible"] {
      overflow: visible;
    }
  `,
  group: css`
    opacity: var(--_openui-line-chart-group-opacity, 1);
    transition: var(--_openui-line-chart-group-transition, all 0s ease 0s);
  `,
  root: css`
    ${cartesianContainer}
  `,
  containerInner: css`
    ${cartesianContainerInner}
  `,
  yAxisContainer: css`
    ${cartesianYAxisContainer}
  `,
  mainContainer: css`
    ${cartesianMainContainer}
  `,
  gridLine: css`
    ${gridLine} &[data-zero] {
      ${zeroGridLine}
    }
  `,
  yTick: css`
    ${svgTickLabel}
  `,
  xTick: css`
    ${svgTickLabel}
  `,
  xTickAngled: css`
    ${svgTickLabel}
  `,
  crosshairLine: css`
    ${crosshairLine}
  `,
  activeDotOuter: css`
    ${activeDotOuter}
  `,
  activeDotInner: css`
    ${activeDotInner}
  `,
  dot: css`
    stroke: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    stroke-width: 1;
  `,
  line: css`
    fill: none;
    stroke-width: 2;
  `,
  lineAnimated: css`
    @media (prefers-reduced-motion: no-preference) {
      stroke-dasharray: var(--_openui-line-chart-line-path-length);
      stroke-dashoffset: var(--_openui-line-chart-line-path-length);
      animation: ${drawLineAnimation} 1s ease-out forwards;
    }
  `,
};
