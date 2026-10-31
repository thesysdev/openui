import { css } from "../../styles/css";

const body = `
  font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;
export const names = {
  root: "openui-accordion",
  item: "openui-accordion-item",
  header: "openui-accordion-header",
  trigger: "openui-accordion-trigger",
  triggerContent: "openui-accordion-trigger-content",
  triggerContentIcon: "openui-accordion-trigger-content-icon",
  triggerIcon: "openui-accordion-trigger-icon",
  content: "openui-accordion-content",
  contentWrapper: "openui-accordion-content-wrapper",
  variant: {
    clear: "openui-accordion--variant-clear",
    card: "openui-accordion--variant-card",
    sunk: "openui-accordion--variant-sunk",
  },
} as const;
export const accordionStyles = {
  root: css`
    box-sizing: border-box;
    border-radius: var(--openui-radius-2xl, 14px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    padding: calc(var(--openui-space-m, 12px) + 2px);
    padding-bottom: 0;
  `,
  item: css`
    box-sizing: border-box;
    overflow: hidden;
    border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    --_openui-accordion-trigger-padding-top: var(--openui-space-l, 18px);
    &:first-child {
      margin-top: 0;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      --_openui-accordion-trigger-padding-top: 0;
    }
    &:last-child {
      border-bottom-left-radius: var(--_openui-accordion-item-last-radius);
      border-bottom-right-radius: var(--_openui-accordion-item-last-radius);
      border-bottom: var(--_openui-accordion-item-last-border);
    }
    &:focus-within {
      position: relative;
      z-index: 1;
    }
  `,
  header: css`
    display: flex;
    margin-block-start: 0;
    margin-block-end: 0;
    margin-inline-start: 0;
    margin-inline-end: 0;
  `,
  trigger: css`
    border: none;
    box-sizing: border-box;
    ${body}
    background-color: transparent;
    padding: var(--openui-space-l, 18px) 0;
    width: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    cursor: pointer;
    padding-top: var(--_openui-accordion-trigger-padding-top, var(--openui-space-l, 18px));
    --_openui-accordion-icon-transform: none;
    &[data-state="open"] {
      --_openui-accordion-icon-transform: rotate(180deg);
    }
  `,
  triggerContent: css`
    display: flex;
    align-items: center;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    gap: var(--openui-space-xs, 6px);
  `,
  triggerContentIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    width: 16px;
  `,
  triggerIcon: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    height: 16px;
    width: 16px;
    transition: transform 300ms cubic-bezier(0.87, 0, 0.13, 1);
    transform: var(--_openui-accordion-icon-transform);
  `,
  content: css`
    overflow: hidden;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    ${body}
    &[data-state="open"] {
      animation: _openui-accordion-down 300ms cubic-bezier(0.87, 0, 0.13, 1);
    }
    &[data-state="closed"] {
      animation: _openui-accordion-up 300ms cubic-bezier(0.87, 0, 0.13, 1);
    }
    @keyframes _openui-accordion-down {
      from {
        height: 0;
      }
      to {
        height: var(--radix-accordion-content-height);
      }
    }
    @keyframes _openui-accordion-up {
      from {
        height: var(--radix-accordion-content-height);
      }
      to {
        height: 0;
      }
    }
  `,
  contentWrapper: css`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 0;
    gap: var(--_openui-accordion-content-gap);
    padding-bottom: var(--_openui-accordion-content-padding-bottom);
  `,
  variant: {
    clear: css`
      border: 1px solid transparent;
      box-shadow: none;
      padding: 0;
      --_openui-accordion-item-last-radius: 0px;
      --_openui-accordion-item-last-border: 1px solid transparent;
      --_openui-accordion-content-gap: var(--openui-space-m, 12px);
      --_openui-accordion-content-padding-bottom: var(--openui-space-l, 18px);
    `,
    card: css`
      --_openui-accordion-item-last-radius: 0px;
      --_openui-accordion-item-last-border: none;
      --_openui-accordion-content-gap: var(--openui-space-l, 18px);
      --_openui-accordion-content-padding-bottom: var(--openui-space-m, 12px);
    `,
    sunk: css`
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
      --_openui-accordion-item-last-radius: 4px;
      --_openui-accordion-item-last-border: none;
      --_openui-accordion-content-gap: var(--openui-space-l, 18px);
      --_openui-accordion-content-padding-bottom: var(--openui-space-m, 12px);
    `,
  },
};
