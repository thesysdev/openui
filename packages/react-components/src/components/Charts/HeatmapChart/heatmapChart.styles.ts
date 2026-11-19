import { css } from "../../../styles/css";

import { fadeAppearAnimation } from "../shared/animations/fadeAppear.styles";
import { centeredContainer } from "../shared/chartBaseDeclarations";
import { svgTickLabel } from "../shared/chartTypography";

/** Stable override targets for HeatmapChart. */
export const names = {
  root: "openui-heatmap-chart",
  xTick: "openui-heatmap-chart-x-tick",
  yTick: "openui-heatmap-chart-y-tick",
  cell: "openui-heatmap-chart-cell",
  cellLabel: "openui-heatmap-chart-cell-label",
  cellIsAnimationActive: "openui-heatmap-chart-cell--is-animation-active",
  cellLabelIsAnimationActive: "openui-heatmap-chart-cell-label--is-animation-active",
  colorScale: "openui-heatmap-chart-color-scale",
  colorScaleLabel: "openui-heatmap-chart-color-scale-label",
  colorScaleRamp: "openui-heatmap-chart-color-scale-ramp",
  colorScaleRampRampModeDiverging: "openui-heatmap-chart-color-scale-ramp--ramp-mode-diverging",
  colorScaleBucket: "openui-heatmap-chart-color-scale-bucket",
  colorScaleRampRampModeSequential: "openui-heatmap-chart-color-scale-ramp--ramp-mode-sequential",
  yAxis: "openui-heatmap-chart-y-axis",
  xAxis: "openui-heatmap-chart-x-axis",
  svg: "openui-heatmap-chart-svg",
  group: "openui-heatmap-chart-group",
  textLine: "openui-heatmap-chart-text-line",
  hitbox: "openui-heatmap-chart-hitbox",
  rampMode: {
    sequential: "openui-heatmap-chart--ramp-mode-sequential",
    diverging: "openui-heatmap-chart--ramp-mode-diverging",
  },
  isAnimationActive: {
    true: "openui-heatmap-chart--is-animation-active",
  },
} as const;

export const heatmapChartStyles = {
  root: css`
    ${centeredContainer}
    width: var(--_openui-heatmap-chart-root-width, 100%);
    height: var(--_openui-heatmap-chart-root-height, unset);
  `,
  xTick: css`
    /* Radar and Heatmap tick labels. */
    ${svgTickLabel}
  `,
  yTick: css`
    /* Radar and Heatmap tick labels. */
    ${svgTickLabel}
  `,
  cell: css`
    transition: fill 0.2s ease;
    @media print {
      transition: none;
    }
    &:hover {
      stroke: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
      stroke-width: 1.5;
    }
    &[data-empty] {
      fill: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      fill-opacity: 0.35;
    }
    animation-delay: var(--_openui-heatmap-chart-cell-animation-delay, unset);
    cursor: var(--_openui-heatmap-chart-cell-cursor, unset);
  `,
  cellLabel: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    pointer-events: none;
    user-select: none;
    transition: fill 0.2s ease;
    @media print {
      transition: none;
    }
    fill: var(--_openui-heatmap-chart-cell-label-fill, unset);
    animation-delay: var(--_openui-heatmap-chart-cell-label-animation-delay, unset);
  `,
  cellIsAnimationActive: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      animation: ${fadeAppearAnimation} 0.4s ease-out forwards;
      animation-delay: var(--_openui-heatmap-chart-cell-animation-delay, 0s);
    }
  `,
  cellLabelIsAnimationActive: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      animation: ${fadeAppearAnimation} 0.4s ease-out forwards;
      animation-delay: var(--_openui-heatmap-chart-cell-label-animation-delay, 0s);
    }
  `,
  colorScale: css`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 0 2px;
  `,
  colorScaleLabel: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    white-space: nowrap;
  `,
  colorScaleRamp: css`
    position: relative;
    display: flex;
    flex: 1;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
  `,
  colorScaleRampRampModeDiverging: css`
    &::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 2px;
      transform: translateX(-50%);
      background: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
      opacity: 0.55;
    }
  `,
  colorScaleBucket: css`
    flex: 1;
    background-color: var(--_openui-heatmap-chart-color-scale-bucket-background-color, unset);
  `,
  svg: css`
    overflow: var(--_openui-heatmap-chart-svg-overflow, unset);
  `,
};
