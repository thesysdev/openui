import { css } from "../../../../../styles/css";

export const names = {
  root: "openui-chart-tooltip",
  portal: "openui-chart-tooltip-portal",
  label: "openui-chart-tooltip-label",
  content: "openui-chart-tooltip-content",
  item: "openui-chart-tooltip-content-item",
  indicator: "openui-chart-tooltip-content-indicator",
  valueWrapper: "openui-chart-tooltip-content-value-wrapper",
  contentLabel: "openui-chart-tooltip-content-label",
  value: "openui-chart-tooltip-content-value",
  separator: "openui-chart-tooltip-content-item-separator",
  viewMore: "openui-chart-tooltip-content-view-more",
  labelText: "openui-chart-tooltip-label-text",
} as const;

export const portalTooltipStyles = {
  portal: css`
    pointer-events: none;
    z-index: 1000;
    position: var(--_openui-chart-tooltip-position, absolute);
    top: 0;
    left: 0;
    opacity: 0;
    transition: opacity 0.12s ease;
    &[data-positioned] {
      opacity: 1;
    }
  `,
  root: css`
    display: grid;
    align-items: start;
    min-width: 128px;
    max-width: 240px;
    gap: var(--openui-space-xs, 6px);
    padding: var(--openui-space-xs, 6px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    border-radius: var(--openui-radius-l, 10px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
  `,
  label: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    overflow-wrap: break-word;
    word-break: break-word;
  `,
  content: css`
    display: grid;
    align-items: start;
    min-width: 128px;
    gap: var(--openui-space-xs, 6px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
  `,
  item: css`
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    gap: var(--openui-space-xs, 6px);
    align-items: flex-start;
    &[data-layout="multiple"] {
      align-items: center;
    }
  `,
  indicator: css`
    flex-shrink: 0;
    border-radius: var(--openui-radius-2xs, 2px);
    height: 10px;
    width: 10px;
    background-color: var(--_openui-chart-tooltip-indicator-color);
    border-color: var(--_openui-chart-tooltip-indicator-color);
    &[data-layout="two-items"] {
      margin-top: 2px;
    }
  `,
  valueWrapper: css`
    display: flex;
    flex: 1;
    gap: var(--openui-space-s, 8px);
    justify-content: space-between;
    line-height: 1;
    align-items: center;
    &[data-layout="two-items"] {
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      gap: var(--openui-space-2xs, 4px);
    }
  `,
  contentLabel: css`
    display: grid;
    gap: var(--openui-space-xs, 6px);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  value: css`
    font-variant-numeric: tabular-nums;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  separator: css`
    width: 100%;
    height: 1px;
    background-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    margin: 0;
    &[data-last] {
      display: none;
    }
  `,
  viewMore: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    text-align: left;
    overflow-wrap: break-word;
    word-break: break-word;
  `,
  labelText: css`
    display: block;
    overflow-wrap: break-word;
    word-break: break-word;
  `,
};
