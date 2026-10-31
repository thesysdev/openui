import { css } from "../../styles/css";

export const names = {
  root: "openui-callout",
  title: "openui-callout-title",
  description: "openui-callout-description",
  variant: {
    neutral: "openui-callout--variant-neutral",
    info: "openui-callout--variant-info",
    warning: "openui-callout--variant-warning",
    success: "openui-callout--variant-success",
    danger: "openui-callout--variant-danger",
  },
} as const;

export const calloutStyles = {
  root: css`
    @keyframes _openui-callout-fadeout {
      0% {
        opacity: 1;
        max-height: 200px;
        padding-top: var(--openui-space-000, 0);
        padding-bottom: var(--openui-space-000, 0);
        margin-bottom: 0;
      }
      70% {
        opacity: 0;
        max-height: 200px;
      }
      100% {
        opacity: 0;
        max-height: 0;
        padding-top: 0;
        padding-bottom: 0;
        margin-bottom: 0;
        overflow: hidden;
      }
    }
    &[data-autodismiss] {
      animation: _openui-callout-fadeout 0.4s ease-in forwards;
      animation-delay: var(--_openui-callout-duration, 3000ms);
    }
    display: flex;
    flex-direction: column;
    padding: var(--openui-space-000, 0) calc(var(--openui-space-m, 12px) + 2px);
    box-sizing: border-box;
    align-items: flex-start;
    border-left: 2px solid;
  `,
  title: css`
    color: var(--_openui-callout-title-color);
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
      border-color: var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
      --_openui-callout-title-color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    `,
    info: css`
      border-color: var(--openui-border-info-emphasis, oklch(0.546 0.215 262.881 / 1));
      --_openui-callout-title-color: var(
        --openui-text-info-primary,
        oklch(0.424 0.181 265.638 / 1)
      );
    `,
    warning: css`
      border-color: var(--openui-border-alert-emphasis, oklch(0.681 0.142 75.834 / 1));
      --_openui-callout-title-color: var(
        --openui-text-alert-primary,
        oklch(0.476 0.103 61.907 / 1)
      );
    `,
    success: css`
      border-color: var(--openui-border-success-emphasis, oklch(0.627 0.17 149.214 / 1));
      --_openui-callout-title-color: var(
        --openui-text-success-primary,
        oklch(0.448 0.108 151.328 / 1)
      );
    `,
    danger: css`
      border-color: var(--openui-border-danger-emphasis, oklch(0.577 0.215 27.325 / 1));
      --_openui-callout-title-color: var(
        --openui-text-danger-primary,
        oklch(0.505 0.19 27.518 / 1)
      );
    `,
  },
};
