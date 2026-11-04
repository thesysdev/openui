import { css } from "../../styles/css";

const body = `
  font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

export const names = {
  root: "openui-switch-item",
  container: "openui-switch-item-container",
  thumb: "openui-switch-item-thumb",
  label: "openui-switch-item-label",
  description: "openui-switch-item-description",
  content: "openui-switch-item-content",
} as const;

export const switchItemStyles = {
  root: css`
    position: relative;
    display: inline-block;
    flex-shrink: 0;
    height: 16px;
    width: 24px;
    margin-top: var(--openui-space-2xs, 4px);
    cursor: pointer;
    border-radius: var(--openui-radius-full, 9999px);
    padding: var(--openui-space-3xs, 2px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    transition-property: background-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    &:hover {
      border-color: var(
        --_openui-switch-item-hover-border,
        var(--openui-border-interactive, oklch(0.097 0 0 / 0.12))
      );
    }
    &[data-state="checked"] {
      --_openui-switch-item-border: var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
      --_openui-switch-item-hover-border: var(--_openui-switch-item-border);
      background-color: var(--openui-interactive-accent-default, oklch(0.546 0.215 262.881 / 1));
      border: 1px solid var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
    }
    &[data-disabled] {
      border-color: var(
        --_openui-switch-item-border,
        var(--openui-border-default, oklch(0.097 0 0 / 0.06))
      );
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  container: css`
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    gap: var(--openui-space-s, 8px);
    max-width: 100%;
    width: 100%;
    overflow: hidden;
    padding: var(--openui-space-3xs, 2px) var(--openui-space-000, 0px);
  `,
  thumb: css`
    position: absolute;
    display: block;
    height: 10px;
    width: 10px;
    border-radius: var(--openui-radius-full, 9999px);
    border: none;
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    transform: translateY(-50%) translateX(0px);
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
    &[data-state="checked"] {
      transform: translateY(-50%) translateX(8px);
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    }
  `,
  label: css`
    ${body}
    flex: 1;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    &:disabled {
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    }
  `,
  description: css`
    ${body}
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
};
