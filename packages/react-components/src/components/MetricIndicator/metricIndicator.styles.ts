import { css } from "../../styles/css";

export const names = {
  root: "openui-metric-indicator",
  row: "openui-metric-indicator-row",
  mainValue: "openui-metric-indicator-main-value",
  previousValue: "openui-metric-indicator-previous-value",
  subtext: "openui-metric-indicator-subtext",
  trend: "openui-metric-indicator-trend",
  variant: {
    inline: "openui-metric-indicator--variant-inline",
    "with-strikethrough": "openui-metric-indicator--variant-with-strikethrough",
  },
  direction: {
    up: "openui-metric-indicator-trend--direction-up",
    down: "openui-metric-indicator-trend--direction-down",
  },
} as const;
export const metricIndicatorStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--_openui-metric-indicator-gap);
    &[data-subtext="true"] {
      gap: var(--openui-space-3xs, 2px);
    }
  `,
  row: css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: var(--_openui-metric-indicator-row-align);
    gap: var(--_openui-metric-indicator-row-gap);
    min-width: 0;
  `,
  mainValue: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-numbers-default-heavy, 560 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-numbers-default-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
  `,
  previousValue: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    text-decoration: line-through;
    font: var(--openui-text-numbers-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-numbers-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    margin-bottom: 1px;
  `,
  subtext: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    min-width: 0;
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    margin-top: 0;
  `,
  trend: css`
    font: var(--openui-text-numbers-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-numbers-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    margin-bottom: 1px;
  `,
  variant: {
    inline: css`
      --_openui-metric-indicator-gap: 0;
      --_openui-metric-indicator-row-align: baseline;
      --_openui-metric-indicator-row-gap: var(--openui-space-2xs, 4px);
    `,
    "with-strikethrough": css`
      --_openui-metric-indicator-gap: var(--openui-space-3xs, 2px);
      --_openui-metric-indicator-row-align: flex-end;
      --_openui-metric-indicator-row-gap: var(--openui-space-xs, 6px);
    `,
  },
  direction: {
    up: css`
      color: var(--openui-text-success-primary, oklch(0.448 0.108 151.328 / 1));
    `,
    down: css`
      color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
    `,
  },
};
