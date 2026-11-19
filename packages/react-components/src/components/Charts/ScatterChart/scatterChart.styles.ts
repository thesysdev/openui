import { css } from "../../../styles/css";

import { centeredContainer, gridLine, zeroGridLine } from "../shared/chartBaseDeclarations";
import { svgTickLabel } from "../shared/chartTypography";

export const names = {
  root: "openui-scatter-chart",
  grid: "openui-scatter-chart-grid",
  gridVertical: "openui-scatter-chart-grid-vertical",
  gridLine: "openui-scatter-chart-grid-line",
  yAxis: "openui-scatter-chart-y-axis",
  xAxis: "openui-scatter-chart-x-axis",
  yTick: "openui-scatter-chart-y-tick",
  xTick: "openui-scatter-chart-x-tick",
  dots: "openui-scatter-chart-dots",
  dot: "openui-scatter-chart-dot",
  dotAnimated: { true: "openui-scatter-chart-dot--is-animation-active" },
  svg: "openui-scatter-chart-svg",
  group: "openui-scatter-chart-group",
  hitTarget: "openui-scatter-chart-hit-target",
} as const;

export const scatterChartStyles = {
  svg: css`
    overflow: visible;
  `,
  root: css`
    ${centeredContainer}
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
  dot: css`
    stroke: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    stroke-width: 1.5;
    fill-opacity: var(--_openui-scatter-chart-dot-opacity, 1);
    stroke-opacity: var(--_openui-scatter-chart-dot-opacity, 1);
    transition:
      r 0.15s ease,
      fill-opacity 0.15s ease,
      stroke-opacity 0.15s ease;
  `,
  appear: css`
    @keyframes openui-scatter-chart-appear {
      from {
        opacity: 0;
        r: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  dotAnimated: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      animation: openui-scatter-chart-appear 0.4s ease-out
        var(--_openui-scatter-chart-dot-delay, 0s) forwards;
    }
  `,
};
