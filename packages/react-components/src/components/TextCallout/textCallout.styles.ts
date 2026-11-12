import { css } from "../../styles/css";

export const names = {
  root: "openui-text-callout",
  content: "openui-text-callout-content",
  title: "openui-text-callout-title",
  description: "openui-text-callout-description",
  variant: {
    neutral: "openui-text-callout--variant-neutral",
    info: "openui-text-callout--variant-info",
    warning: "openui-text-callout--variant-warning",
    success: "openui-text-callout--variant-success",
    danger: "openui-text-callout--variant-danger",
  },
} as const;

export const textCalloutStyles = {
  root: css`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: var(--openui-space-xs, 6px);
    padding: 0 16px 0 16px;
    box-sizing: border-box;
  `,
  content: css`
    display: flex;
    flex-direction: column;
  `,
  title: css`
    font: var(--openui-text-body-default-heavy, 560 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
  `,
  description: css`
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  variant: {
    neutral: css`
      border-left: 2px solid var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    `,
    info: css`
      border-left: 2px solid var(--openui-border-info-emphasis, oklch(0.546 0.215 262.881 / 1));
      color: var(--openui-text-info-primary, oklch(0.424 0.181 265.638 / 1));
    `,
    warning: css`
      border-left: 2px solid var(--openui-border-alert-emphasis, oklch(0.681 0.142 75.834 / 1));
      color: var(--openui-text-alert-primary, oklch(0.476 0.103 61.907 / 1));
    `,
    success: css`
      border-left: 2px solid var(--openui-border-success-emphasis, oklch(0.627 0.17 149.214 / 1));
      color: var(--openui-text-success-primary, oklch(0.448 0.108 151.328 / 1));
    `,
    danger: css`
      border-left: 2px solid var(--openui-border-danger-emphasis, oklch(0.577 0.215 27.325 / 1));
      color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
    `,
  },
};
