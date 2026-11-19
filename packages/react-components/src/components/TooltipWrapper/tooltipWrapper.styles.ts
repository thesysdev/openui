import { css } from "../../styles/css";

const smallBody = `
  font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;
export const names = {
  body: "openui-tooltip-wrapper-body",
  heading: "openui-tooltip-wrapper-heading",
  text: "openui-tooltip-wrapper-text",
  root: "openui-tooltip-wrapper",
} as const;
export const tooltipWrapperStyles = {
  body: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-2xs, 4px);
    width: 100%;
    max-width: 248px;
  `,
  heading: css`
    ${smallBody}
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    width: 100%;
  `,
  text: css`
    ${smallBody}
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    width: 100%;
  `,
  root: css`
    box-sizing: border-box;
    background-color: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    padding: var(--openui-space-xs, 6px) var(--openui-space-s, 8px);
    outline: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    z-index: 9999;
    border-radius: var(--openui-radius-s, 6px);
    user-select: none;
    animation-duration: 400ms;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform, opacity;
    &[data-state="delayed-open"] {
      animation-name: var(--_openui-tooltip-wrapper-animation);
    }
    &[data-side="top"] {
      --_openui-tooltip-wrapper-animation: _openui-tooltip-down;
    }
    &[data-side="right"] {
      --_openui-tooltip-wrapper-animation: _openui-tooltip-left;
    }
    &[data-side="bottom"] {
      --_openui-tooltip-wrapper-animation: _openui-tooltip-up;
    }
    &[data-side="left"] {
      --_openui-tooltip-wrapper-animation: _openui-tooltip-right;
    }
    @keyframes _openui-tooltip-down {
      from {
        opacity: 0;
        transform: translateY(-2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes _openui-tooltip-left {
      from {
        opacity: 0;
        transform: translateX(2px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes _openui-tooltip-up {
      from {
        opacity: 0;
        transform: translateY(2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes _openui-tooltip-right {
      from {
        opacity: 0;
        transform: translateX(-2px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
};
