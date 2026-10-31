import { css } from "../../../styles/css";

import {
  cartesianContainer,
  cartesianContainerInner,
  cartesianMainContainer,
  cartesianYAxisContainer,
  gridLine,
  zeroGridLine,
} from "../shared/chartBaseDeclarations";
import { svgTickLabel } from "../shared/chartTypography";

export const names = {
  root: "openui-bar-chart",
  variant: {
    grouped: "openui-bar-chart--variant-grouped",
    stacked: "openui-bar-chart--variant-stacked",
  },
  containerInner: "openui-bar-chart-container-inner",
  yAxisContainer: "openui-bar-chart-y-axis-container",
  mainContainer: "openui-bar-chart-main-container",
  grid: "openui-bar-chart-grid",
  gridLine: "openui-bar-chart-grid-line",
  yAxis: "openui-bar-chart-y-axis",
  yTick: "openui-bar-chart-y-tick",
  xAxis: "openui-bar-chart-x-axis",
  xTick: "openui-bar-chart-x-tick",
  xTickAngled: "openui-bar-chart-x-tick-angled",
  bars: "openui-bar-chart-bars",
  bar: "openui-bar-chart-bar",
  internalLine: "openui-bar-chart-internal-line",
  hoverHighlight: "openui-bar-chart-hover-highlight",
  barAnimated: { true: "openui-bar-chart-bar--is-animation-active" },
  internalLineAnimated: { true: "openui-bar-chart-internal-line--is-animation-active" },
  svg: "openui-bar-chart-svg",
  group: "openui-bar-chart-group",
  hitTarget: "openui-bar-chart-hit-target",
  tickLine: "openui-bar-chart-tick-line",
  defs: "openui-bar-chart-defs",
  clip: "openui-bar-chart-clip",
  clipRect: "openui-bar-chart-clip-rect",
} as const;

const animated = `@media (prefers-reduced-motion: no-preference) {
 transform-box: fill-box;
 transform-origin: center bottom;
 animation: openui-bar-chart-grow 0.6s ease-out var(--_openui-bar-chart-mark-delay, 0s) both;
 &[data-negative] { transform-origin: center top; }
}`;
export const barChartStyles = {
  svg: css`
    &[data-overflow="visible"] {
      overflow: visible;
    }
  `,
  group: css`
    opacity: var(--_openui-bar-chart-group-opacity, 1);
    transition: var(--_openui-bar-chart-group-transition, all 0s ease 0s);
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
  grow: css`
    @keyframes openui-bar-chart-grow {
      from {
        transform: scaleY(0);
      }
      to {
        transform: scaleY(1);
      }
    }
  `,
  barAnimated: css`
    ${animated}
  `,
  internalLineAnimated: css`
    ${animated}
  `,
  internalLine: css`
    pointer-events: none;
  `,
  hoverHighlight: css`
    fill: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    opacity: 0.04;
    pointer-events: none;
  `,
};
