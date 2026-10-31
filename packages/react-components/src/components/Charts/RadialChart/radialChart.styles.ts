import { css } from "../../../styles/css";

import { fadeAppearAnimation } from "../shared/animations/fadeAppear.styles";
import { centeredContainer, centeredSvgWrapper } from "../shared/chartBaseDeclarations";

/** Stable override targets for RadialChart. */
export const names = {
  root: "openui-radial-chart",
  svgWrapper: "openui-radial-chart-svg-wrapper",
  gridCircle: "openui-radial-chart-grid-circle",
  barIsAnimationActive: "openui-radial-chart-bar--is-animation-active",
  bar: "openui-radial-chart-bar",
  grid: "openui-radial-chart-grid",
  svg: "openui-radial-chart-svg",
  group: "openui-radial-chart-group",
  variant: {
    circular: "openui-radial-chart--variant-circular",
    semiCircular: "openui-radial-chart--variant-semi-circular",
  },
  isAnimationActive: {
    true: "openui-radial-chart--is-animation-active",
  },
} as const;

export const radialChartStyles = {
  root: css`
    ${centeredContainer}
    width: var(--_openui-radial-chart-root-width, 100%);
    height: var(--_openui-radial-chart-root-height, unset);
  `,
  svgWrapper: css`
    ${centeredSvgWrapper}
  `,
  gridCircle: css`
    stroke: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    stroke-width: 1;
    stroke-dasharray: 4 4;
  `,
  barIsAnimationActive: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      animation: ${fadeAppearAnimation} 0.5s ease-out forwards;
      animation-delay: var(--_openui-radial-chart-bar-animation-delay, 0s);
    }
  `,
  bar: css`
    fill-opacity: var(--_openui-radial-chart-bar-fill-opacity, unset);
    filter: var(--_openui-radial-chart-bar-filter, unset);
    cursor: var(--_openui-radial-chart-bar-cursor, unset);
    animation-delay: var(--_openui-radial-chart-bar-animation-delay, unset);
    transition: var(--_openui-radial-chart-bar-transition, unset);
  `,
};
