import { css } from "../../styles/css";

export const names = { root: "openui-text-area" } as const;

// Invalid wins over focus's border; disabled wins over both. The focus ring is unchanged.
export const textAreaStyles = {
  root: css`
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    box-sizing: border-box;
    width: 100%;
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    border-radius: var(--openui-radius-xl, 12px);
    padding: var(--openui-space-s, 8px) var(--openui-space-m, 12px);
    gap: var(--openui-space-xs, 6px);
    background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    outline: none;
    resize: none;
    transition:
      box-shadow 0.16s ease,
      border-color 0.16s ease,
      background-color 0.16s ease;
    &::placeholder {
      color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    }
    &:focus-within {
      box-shadow: 0 0 0 2.5px var(--openui-border-default, oklch(0.097 0 0 / 0.06));

      border-color: var(--openui-border-interactive-emphasis, oklch(0.097 0 0 / 0.3));
    }
    &[aria-invalid="true"] {
      border-color: var(--openui-border-danger-emphasis, oklch(0.577 0.215 27.325 / 1));
    }
    &:disabled {
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      cursor: not-allowed;
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    }
  `,
};
