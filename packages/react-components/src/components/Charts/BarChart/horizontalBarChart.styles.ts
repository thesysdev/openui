import { css } from "../../../styles/css";

import { gridLine } from "../shared/chartBaseDeclarations";
import { svgTickLabel, svgTickTypography } from "../shared/chartTypography";

export const names = {
  root: "openui-horizontal-bar-chart",
  variant: {
    grouped: "openui-horizontal-bar-chart--variant-grouped",
    stacked: "openui-horizontal-bar-chart--variant-stacked",
  },
  containerInnerWrapper: "openui-horizontal-bar-chart-container-inner-wrapper",
  containerInner: "openui-horizontal-bar-chart-container-inner",
  mainContainer: "openui-horizontal-bar-chart-main-container",
  xAxisContainer: "openui-horizontal-bar-chart-x-axis-container",
  categoryLabel: "openui-horizontal-bar-chart-category-label",
  xTick: "openui-horizontal-bar-chart-x-tick",
  gridVertical: "openui-horizontal-bar-chart-grid-vertical",
  gridLine: "openui-horizontal-bar-chart-grid-line",
  xAxis: "openui-horizontal-bar-chart-x-axis",
  internalLine: "openui-horizontal-bar-chart-internal-line",
  crosshair: "openui-horizontal-bar-chart-crosshair",
  bars: "openui-horizontal-bar-chart-bars",
  bar: "openui-horizontal-bar-chart-bar",
  row: "openui-horizontal-bar-chart-row",
  barAnimated: { true: "openui-horizontal-bar-chart-bar--is-animation-active" },
  internalLineAnimated: { true: "openui-horizontal-bar-chart-internal-line--is-animation-active" },
  svg: "openui-horizontal-bar-chart-svg",
  group: "openui-horizontal-bar-chart-group",
  labelContainer: "openui-horizontal-bar-chart-label-container",
} as const;
const animated = `@media (prefers-reduced-motion: no-preference) {
 transform-box: fill-box;
 transform-origin: left center;
 animation: openui-horizontal-bar-chart-grow 0.6s ease-out var(--_openui-horizontal-bar-chart-mark-delay, 0s) both;
 &[data-negative] { transform-origin: right center; }
}`;
export const horizontalBarChartStyles = {
  labelContainer: css`
    pointer-events: none;
  `,
  group: css`
    opacity: var(--_openui-horizontal-bar-chart-group-opacity, 1);
    transition: var(--_openui-horizontal-bar-chart-group-transition, all 0s ease 0s);
  `,
  root: css`
    position: relative;
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
  `,
  grow: css`
    @keyframes openui-horizontal-bar-chart-grow {
      from {
        transform: scaleX(0);
      }
      to {
        transform: scaleX(1);
      }
    }
  `,
  barAnimated: css`
    ${animated}
  `,
  internalLineAnimated: css`
    ${animated}
  `,
  gridLine: css`
    ${gridLine}
  `,
  containerInnerWrapper: css`
    width: 100%;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  `,
  containerInner: css`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-width: 0;
  `,
  mainContainer: css`
    height: 100%;
    overflow-y: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    scrollbar-width: none;
    ms-overflow-style: none;
  `,
  xAxisContainer: css`
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    border-top: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    padding-top: var(--openui-space-2xs, 4px);
  `,
  categoryLabel: css`
    display: flex;
    align-items: center;
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    ${svgTickTypography}
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 100%;
    padding-left: var(--openui-space-m, 12px);
    box-sizing: border-box;
  `,
  xTick: css`
    ${svgTickLabel}
  `,
  internalLine: css`
    pointer-events: none;
  `,
  crosshair: css`
    fill: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    opacity: 0.04;
    pointer-events: none;
  `,
};
