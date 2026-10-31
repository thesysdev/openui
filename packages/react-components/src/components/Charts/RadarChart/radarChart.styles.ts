import { css } from "../../../styles/css";

import {
  activeDotInner,
  activeDotOuter,
  centeredContainer,
  centeredSvgWrapper,
} from "../shared/chartBaseDeclarations";
import { svgTickLabel } from "../shared/chartTypography";

/** Stable override targets for RadarChart. */
export const names = {
  root: "openui-radar-chart",
  svgWrapper: "openui-radar-chart-svg-wrapper",
  svg: "openui-radar-chart-svg",
  gridRing: "openui-radar-chart-grid-ring",
  gridSpoke: "openui-radar-chart-grid-spoke",
  polygonArea: "openui-radar-chart-polygon-area",
  polygonStroke: "openui-radar-chart-polygon-stroke",
  dot: "openui-radar-chart-dot",
  activeDotOuter: "openui-radar-chart-active-dot-outer",
  activeDotInner: "openui-radar-chart-active-dot-inner",
  activeDots: "openui-radar-chart-active-dots",
  axisLabel: "openui-radar-chart-axis-label",
  polygonIsAnimationActive: "openui-radar-chart-polygon--is-animation-active",
  grid: "openui-radar-chart-grid",
  series: "openui-radar-chart-series",
  axisLabels: "openui-radar-chart-axis-labels",
  polygon: "openui-radar-chart-polygon",
  group: "openui-radar-chart-group",
  textLine: "openui-radar-chart-text-line",
  hitbox: "openui-radar-chart-hitbox",
  variant: {
    line: "openui-radar-chart--variant-line",
    area: "openui-radar-chart--variant-area",
  },
  gridShape: {
    polygon: "openui-radar-chart--grid-shape-polygon",
    circle: "openui-radar-chart--grid-shape-circle",
  },
  isAnimationActive: {
    true: "openui-radar-chart--is-animation-active",
  },
} as const;

// Register entrance keyframes before the rules that reference them, on import.
css`
  @keyframes openui-radar-chart-appear {
    from {
      opacity: 0;
      transform: scale(0.3);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
export const radarChartStyles = {
  root: css`
    ${centeredContainer}
    width: var(--_openui-radar-chart-root-width, 100%);
    height: var(--_openui-radar-chart-root-height, unset);
  `,
  svgWrapper: css`
    ${centeredSvgWrapper}
  `,
  svg: css`
    overflow: visible;
  `,
  gridRing: css`
    stroke: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    stroke-width: 1;
  `,
  gridSpoke: css`
    stroke: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    stroke-width: 1;
  `,
  polygonArea: css`
    transition: opacity 0.2s ease;
    animation-delay: var(--_openui-radar-chart-polygon-animation-delay, unset);
  `,
  polygonStroke: css`
    fill: none;
    stroke-width: 2;
    animation-delay: var(--_openui-radar-chart-polygon-animation-delay, unset);
  `,
  dot: css`
    stroke: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    stroke-width: 1.5;
    transition:
      r 0.15s ease,
      opacity 0.15s ease;
    opacity: var(--_openui-radar-chart-dot-opacity, unset);
  `,
  activeDotOuter: css`
    /* RadarChart outer active dot. */
    ${activeDotOuter}
  `,
  activeDotInner: css`
    /* RadarChart inner active dot. */
    ${activeDotInner}
  `,
  activeDots: css`
    /* RadarChart active dots. */
    pointer-events: none;
  `,
  axisLabel: css`
    /* Radar and Heatmap tick labels. */
    ${svgTickLabel}
  `,
  polygonIsAnimationActive: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      transform-origin: center center;
      animation: openui-radar-chart-appear 0.5s ease-out forwards;
      animation-delay: var(--_openui-radar-chart-polygon-animation-delay, 0s);
    }
  `,
};
