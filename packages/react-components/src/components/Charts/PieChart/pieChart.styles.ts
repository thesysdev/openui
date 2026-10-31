import { css } from "../../../styles/css";

import { centeredContainer, centeredSvgWrapper } from "../shared/chartBaseDeclarations";

/** Stable override targets for PieChart. */
export const names = {
  root: "openui-pie-chart",
  svgWrapper: "openui-pie-chart-svg-wrapper",
  track: "openui-pie-chart-track",
  sliceIsAnimationActive: "openui-pie-chart-slice--is-animation-active",
  slice: "openui-pie-chart-slice",
  group: "openui-pie-chart-group",
  svg: "openui-pie-chart-svg",
  hitbox: "openui-pie-chart-hitbox",
  variant: {
    pie: "openui-pie-chart--variant-pie",
    donut: "openui-pie-chart--variant-donut",
  },
  appearance: {
    circular: "openui-pie-chart--appearance-circular",
    semiCircular: "openui-pie-chart--appearance-semi-circular",
  },
  isAnimationActive: {
    true: "openui-pie-chart--is-animation-active",
  },
} as const;

// Register entrance keyframes before the rules that reference them, on import.
css`
  @keyframes openui-pie-chart-appear {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
export const pieChartStyles = {
  root: css`
    ${centeredContainer}
    width: var(--_openui-pie-chart-root-width, 100%);
    height: var(--_openui-pie-chart-root-height, unset);
  `,
  svgWrapper: css`
    ${centeredSvgWrapper}
  `,
  track: css`
    fill: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    fill-opacity: var(--_openui-pie-chart-slice-fill-opacity, unset);
    filter: var(--_openui-pie-chart-slice-filter, unset);
    transition: var(--_openui-pie-chart-slice-transition, unset);
    animation-delay: var(--_openui-pie-chart-slice-animation-delay, unset);
    cursor: var(--_openui-pie-chart-slice-cursor, unset);
  `,
  sliceIsAnimationActive: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      transform-origin: center center;
      animation: openui-pie-chart-appear 0.6s ease-out forwards;
      animation-delay: var(--_openui-pie-chart-slice-animation-delay, 0s);
    }
  `,
  hitbox: css`
    pointer-events: var(--_openui-pie-chart-hitbox-pointer-events, unset);
    cursor: var(--_openui-pie-chart-hitbox-cursor, unset);
  `,
  group: css`
    pointer-events: var(--_openui-pie-chart-group-pointer-events, unset);
  `,
  slice: css`
    fill-opacity: var(--_openui-pie-chart-slice-fill-opacity, unset);
    filter: var(--_openui-pie-chart-slice-filter, unset);
    transition: var(--_openui-pie-chart-slice-transition, unset);
    animation-delay: var(--_openui-pie-chart-slice-animation-delay, unset);
    cursor: var(--_openui-pie-chart-slice-cursor, unset);
  `,
};
