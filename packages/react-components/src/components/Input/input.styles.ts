import { css } from "../../styles/css";

export const names = {
  root: "openui-input",
  size: {
    small: "openui-input--size-small",
    medium: "openui-input--size-medium",
    large: "openui-input--size-large",
  },
} as const;

// Focus precedes invalid, then disabled: each state needs only one attribute or pseudo-class.
// Hover previously restated the resting border, so it needs no separate rule.
export const inputStyles = {
  root: css`
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    border-radius: var(--openui-radius-l, 10px);
    box-sizing: border-box;
    width: 100%;
    gap: var(--openui-space-xs, 6px);
    background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    transition:
      box-shadow 0.16s ease,
      border-color 0.16s ease,
      background-color 0.16s ease;
    &::placeholder {
      color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    }
    &:focus-within {
      outline: none;
      box-shadow: 0 0 0 2.5px var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      border-color: var(--openui-border-interactive-emphasis, oklch(0.097 0 0 / 0.3));
    }
    &[aria-invalid="true"] {
      border-color: var(--openui-border-danger-emphasis, oklch(0.577 0.215 27.325 / 1));
      box-shadow: 0 0 0 2.5px var(--openui-border-danger, oklch(0.577 0.215 27.325 / 0.08));
    }
    &:disabled {
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      cursor: not-allowed;
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    }
  `,
  size: {
    small: css`
      border-radius: calc(var(--openui-radius-m, 8px) - 1px);
      padding: calc(var(--openui-space-2xs, 4px) - 1px) var(--openui-space-s, 8px);
    `,
    medium: css`
      border-radius: var(--openui-radius-m, 8px);
      padding: calc(var(--openui-space-xs, 6px) - 1px) calc(var(--openui-space-m, 12px) - 1px);
    `,
    large: css`
      padding: calc(var(--openui-space-s, 8px) - 1px) var(--openui-space-m, 12px);
    `,
  },
};
