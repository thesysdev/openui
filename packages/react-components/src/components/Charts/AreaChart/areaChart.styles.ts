import { css } from "../../../styles/css";

import { drawLineAnimation } from "../shared/animations/drawLine.styles";
import { fadeAppearAnimation } from "../shared/animations/fadeAppear.styles";
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
  root: "openui-area-chart",
  variant: {
    linear: "openui-area-chart--variant-linear",
    natural: "openui-area-chart--variant-natural",
    step: "openui-area-chart--variant-step",
  },
  stacked: { true: "openui-area-chart--stacked" },
  containerInner: "openui-area-chart-container-inner",
  yAxisContainer: "openui-area-chart-y-axis-container",
  mainContainer: "openui-area-chart-main-container",
  grid: "openui-area-chart-grid",
  gridLine: "openui-area-chart-grid-line",
  yAxis: "openui-area-chart-y-axis",
  yTick: "openui-area-chart-y-tick",
  xAxis: "openui-area-chart-x-axis",
  xTick: "openui-area-chart-x-tick",
  xTickAngled: "openui-area-chart-x-tick-angled",
  crosshair: "openui-area-chart-crosshair",
  crosshairLine: "openui-area-chart-crosshair-line",
  activeDotOuter: "openui-area-chart-active-dot-outer",
  activeDotInner: "openui-area-chart-active-dot-inner",
  areas: "openui-area-chart-areas",
  areaPath: "openui-area-chart-area-path",
  areaLine: "openui-area-chart-area-line",
  areaPathAnimated: { true: "openui-area-chart-area-path--is-animation-active" },
  areaLineAnimated: { true: "openui-area-chart-area-line--is-animation-active" },
  svg: "openui-area-chart-svg",
  group: "openui-area-chart-group",
  hitTarget: "openui-area-chart-hit-target",
  tickLine: "openui-area-chart-tick-line",
  defs: "openui-area-chart-defs",
  clip: "openui-area-chart-clip",
  clipRect: "openui-area-chart-clip-rect",
  gradient: "openui-area-chart-gradient",
  stop: "openui-area-chart-stop",
  highlight: "openui-area-chart-highlight",
} as const;

export const areaChartStyles = {
  svg: css`
    &[data-overflow="visible"] {
      overflow: visible;
    }
  `,
  group: css`
    opacity: var(--_openui-area-chart-group-opacity, 1);
    transition: var(--_openui-area-chart-group-transition, all 0s ease 0s);
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
  areaPath: css`
    transition: opacity 0.2s ease;
  `,
  areaLine: css`
    fill: none;
    stroke-width: 2;
  `,
  areaLineAnimated: css`
    @media (prefers-reduced-motion: no-preference) {
      stroke-dasharray: var(--_openui-area-chart-area-line-path-length);
      stroke-dashoffset: var(--_openui-area-chart-area-line-path-length);
      animation: ${drawLineAnimation} 1s ease-out forwards;
    }
  `,
  areaPathAnimated: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      animation: ${fadeAppearAnimation} 0.6s ease-out 0.4s forwards;
    }
  `,
};
