import { css } from "../../../styles/css";

import { separatorStyles } from "../../Separator/separator.styles";
import { defaultLegendClasses } from "../shared/core/DefaultLegend/defaultLegend.styles";

// DefaultLegend and Separator register on import. Reading their maps keeps those value imports,
// so their rules come first and this chart's legend padding rule follows DefaultLegend's root.
Object.values(defaultLegendClasses);
Object.values(separatorStyles);

/** Stable override targets for SegmentedBar. */
export const names = {
  root: "openui-segmented-bar",
  legend: { true: "openui-segmented-bar--legend" },
  legendVariant: {
    default: "openui-segmented-bar--legend-variant-default",
    stacked: "openui-segmented-bar--legend-variant-stacked",
  },
  track: "openui-segmented-bar-track",
  segment: "openui-segmented-bar-segment",
  segmentLine: "openui-segmented-bar-segment-line",
  stackedLegend: "openui-segmented-bar-stacked-legend",
  legendWrapper: "openui-segmented-bar-legend-wrapper",
  defaultLegend: "openui-segmented-bar-default-legend",
  isAnimationActive: {
    true: "openui-segmented-bar--is-animation-active",
  },
} as const;

export const segmentedBarStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;
    justify-content: center;
    gap: var(--_openui-segmented-bar-root-gap, normal);
  `,
  legend: css`
    --_openui-segmented-bar-root-gap: var(--_openui-segmented-bar-legend-gap);
  `,
  legendVariant: {
    default: css`
      --_openui-segmented-bar-legend-gap: var(--openui-space-m, 12px);
    `,
    stacked: css`
      --_openui-segmented-bar-legend-gap: normal;
    `,
  },
  track: css`
    width: 100%;
    box-sizing: border-box;
    height: 20px;
    background-color: var(--openui-background, oklch(0.97 0 89.876 / 1));
    border-radius: var(--openui-radius-s, 6px);
    overflow: hidden;
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
    display: flex;
    padding: var(--openui-space-2xs, 4px);
    gap: var(--openui-space-3xs, 2px);
  `,
  segment: css`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2px;
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
    position: relative;
    overflow: hidden;
    transition: var(
      --_openui-segmented-bar-segment-transition,
      box-shadow 0.2s ease,
      filter 0.2s ease,
      opacity 0.2s ease
    );
    /* Position only rounds the outer ends, so a plain class still overrides the radius. */
    border-radius: var(--_openui-segmented-bar-segment-border-start-radius, 0)
      var(--_openui-segmented-bar-segment-border-end-radius, 0)
      var(--_openui-segmented-bar-segment-border-end-radius, 0)
      var(--_openui-segmented-bar-segment-border-start-radius, 0);
    &:first-child {
      --_openui-segmented-bar-segment-border-start-radius: var(--openui-radius-xs, 4px);
      --_openui-segmented-bar-segment-border-end-radius: 0;
    }
    &:last-child {
      --_openui-segmented-bar-segment-border-start-radius: 0;
      --_openui-segmented-bar-segment-border-end-radius: var(--openui-radius-xs, 4px);
    }
    width: var(--_openui-segmented-bar-segment-width, unset);
    background-color: var(--_openui-segmented-bar-segment-background-color, unset);
    opacity: var(--_openui-segmented-bar-segment-opacity, unset);
  `,
  segmentLine: css`
    position: absolute;
    transform: translateY(-50%);
    background-color: var(--openui-border-accent-emphasis, oklch(0.546 0.215 262.881 / 0.3));
    top: 50%;
    left: 5px;
    width: calc(100% - 10px);
    height: 1px;
    z-index: 1;
    min-width: 2px;
  `,
  isAnimationActive: css`
    --_openui-segmented-bar-segment-transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  `,
  stackedLegend: css`
    margin-top: var(--openui-space-s, 8px);
  `,
  defaultLegend: css`
    padding-top: var(--_openui-segmented-bar-default-legend-padding-top, unset);
  `,
};
