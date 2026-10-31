import { css } from "../../../../../styles/css";

import { buttonStyles } from "../../../../Button/button.styles";

export const names = {
  root: "openui-default-legend",
  axisLabelContainer: "openui-default-legend-axis-label-container",
  axisLabel: "openui-default-legend-axis-label",
  axisLabelText: "openui-default-legend-axis-label-text",
  list: "openui-default-legend-list",
  item: "openui-default-legend-item",
  indicator: "openui-default-legend-item-indicator",
  label: "openui-default-legend-item-label",
  toggleButton: "openui-default-legend-toggle-button",
  toggleIcon: "openui-default-legend-toggle-button-icon",
  labelContainer: "openui-default-legend-item-label-container",
  percentage: "openui-default-legend-item-percentage",
  icon: "openui-default-legend-item-icon",
} as const;

// Keep Button before these equal-weight part rules.
Object.values(buttonStyles);
export const defaultLegendClasses = {
  root: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--openui-space-s, 8px);
    padding-top: var(--openui-space-m, 12px);
  `,
  axisLabelContainer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--openui-space-m, 12px);
    flex-wrap: wrap;
  `,
  axisLabel: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  axisLabelText: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  list: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--openui-space-m, 12px);
    flex-wrap: wrap;
    &[data-state="collapsed"] {
      flex-wrap: nowrap;
      overflow: hidden;
    }
    &[data-state="expanded"] {
      flex-wrap: wrap;
    }
  `,
  item: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-xs, 6px);
    opacity: var(--_openui-default-legend-item-opacity, 1);
    &[data-clickable] {
      cursor: pointer;
    }
  `,
  indicator: css`
    height: 10px;
    width: 10px;
    flex-shrink: 0;
    border-radius: var(--openui-radius-2xs, 2px);
    background-color: var(--_openui-default-legend-indicator-color);
  `,
  label: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  // react-ui's more-specific Button size rule won the old font/padding declarations.
  // Keep those effective small-Button values, independent of which control renders first.
  toggleButton: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  toggleIcon: css`
    width: 1em;
    height: 1em;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  labelContainer: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-2xs, 4px);
  `,
  percentage: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  icon: css`
    display: flex;
    height: 10px;
    width: 10px;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    :where(&) {
      svg {
        height: 10px;
        width: 10px;
        color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
      }
    }
  `,
};
