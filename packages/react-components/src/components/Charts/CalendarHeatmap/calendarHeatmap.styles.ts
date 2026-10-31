import { css } from "../../../styles/css";

/** Stable override targets for CalendarHeatmap. */
export const names = {
  root: "openui-calendar-heatmap",
  weekdayLabel: "openui-calendar-heatmap-weekday-label",
  legendSwatchSlot: "openui-calendar-heatmap-legend-swatch-slot",
  separator: "openui-calendar-heatmap-separator",
  quarterLabel: "openui-calendar-heatmap-quarter-label",
  legend: "openui-calendar-heatmap-legend",
  legendLabel: "openui-calendar-heatmap-legend-label",
  legendSwatches: "openui-calendar-heatmap-legend-swatches",
  legendSwatch: "openui-calendar-heatmap-legend-swatch",
  legendGradient: "openui-calendar-heatmap-legend-gradient",
  legendGradientHit: "openui-calendar-heatmap-legend-gradient-hit",
  monthLabel: "openui-calendar-heatmap-month-label",
  cell: "openui-calendar-heatmap-cell",
  cellIsAnimationActive: "openui-calendar-heatmap-cell--is-animation-active",
  plot: "openui-calendar-heatmap-plot",
  svg: "openui-calendar-heatmap-svg",
  group: "openui-calendar-heatmap-group",
  pattern: "openui-calendar-heatmap-pattern",
  defs: "openui-calendar-heatmap-defs",
  patternBackground: "openui-calendar-heatmap-pattern-background",
  swatchTile: "openui-calendar-heatmap-swatch-tile",
  patternDot: "openui-calendar-heatmap-pattern-dot",
  patternLine: "openui-calendar-heatmap-pattern-line",
  layout: {
    fluid: "openui-calendar-heatmap--layout-fluid",
    fill: "openui-calendar-heatmap--layout-fill",
  },
  legendVariant: {
    swatches: "openui-calendar-heatmap--legend-variant-swatches",
    gradient: "openui-calendar-heatmap--legend-variant-gradient",
    none: "openui-calendar-heatmap--legend-variant-none",
  },
  isAnimationActive: {
    true: "openui-calendar-heatmap--is-animation-active",
  },
} as const;

// Register entrance keyframes before the rules that reference them, on import.
css`
  @keyframes openui-calendar-heatmap-appear {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
export const calendarHeatmapStyles = {
  root: css`
    /* The plot's inline SVG keeps react-ui's baseline gap, whose size follows the font. Declare it
       so the page's typography (Tailwind's preflight, for one) cannot change the height. */
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;
    width: var(--_openui-calendar-heatmap-root-width, 100%);
    height: var(--_openui-calendar-heatmap-root-height, unset);
  `,
  weekdayLabel: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    fill: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  legendSwatchSlot: css`
    display: inline-flex;
    cursor: pointer;
    @media (prefers-reduced-motion: no-preference) {
      transition:
        fill-opacity 0.2s ease,
        opacity 0.2s ease;
    }
    opacity: var(--_openui-calendar-heatmap-legend-swatch-slot-opacity, unset);
  `,
  separator: css`
    stroke: var(
      --_openui-calendar-heatmap-separator-stroke,
      var(--openui-border-default, oklch(0.097 0 0 / 0.06))
    );
    stroke-width: 1;
  `,
  quarterLabel: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    white-space: nowrap;
    pointer-events: none;

    position: var(--_openui-calendar-heatmap-quarter-label-position, unset);
    top: var(--_openui-calendar-heatmap-quarter-label-top, unset);
    left: var(--_openui-calendar-heatmap-quarter-label-left, unset);
  `,
  legend: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--openui-space-s, 8px);
    width: 100%;
    padding-top: var(--openui-space-m, 12px);
  `,
  legendLabel: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  legendSwatches: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-3xs, 2px);
  `,
  legendSwatch: css`
    display: block;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    border-radius: var(--openui-radius-2xs, 2px);

    background-color: var(--_openui-calendar-heatmap-legend-swatch-background-color, unset);
  `,
  legendGradient: css`
    position: relative;
    width: 60px;
    height: 12px;
    flex-shrink: 0;
    border-radius: var(--openui-radius-2xs, 2px);

    background: var(--_openui-calendar-heatmap-legend-gradient-background, unset);
  `,
  legendGradientHit: css`
    position: absolute;
    top: 0;
    height: 100%;
    cursor: pointer;

    left: var(--_openui-calendar-heatmap-legend-gradient-hit-left, unset);
    width: var(--_openui-calendar-heatmap-legend-gradient-hit-width, unset);
  `,
  monthLabel: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    fill: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  cell: css`
    &:hover {
      stroke: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      stroke-width: 1.5;
    }
    &[data-ghost] {
      fill-opacity: 0.4;
    }
    &[data-dimmed] {
      fill-opacity: 0.3;
    }
    @media (prefers-reduced-motion: no-preference) {
      transition:
        fill-opacity 0.2s ease,
        opacity 0.2s ease;
    }
    fill: var(--_openui-calendar-heatmap-cell-fill, unset);
    animation-delay: var(--_openui-calendar-heatmap-cell-animation-delay, unset);
    cursor: var(--_openui-calendar-heatmap-cell-cursor, unset);
  `,
  cellIsAnimationActive: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      animation: openui-calendar-heatmap-appear 0.4s ease-out forwards;
      animation-delay: var(--_openui-calendar-heatmap-cell-animation-delay, 0s);
    }
  `,
  plot: css`
    position: var(--_openui-calendar-heatmap-plot-position, unset);
    width: var(--_openui-calendar-heatmap-plot-width, unset);
  `,
  svg: css`
    /* Preserve react-ui's inline baseline gap when Preflight resets replaced elements. */
    display: inline;
    vertical-align: baseline;
    overflow: var(--_openui-calendar-heatmap-svg-overflow, unset);
  `,
};
