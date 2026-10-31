import { css } from "../../styles/css";

export const names = { root: "openui-toggle-item" } as const;

export const toggleItemStyles = {
  root: css`
    box-sizing: border-box;
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    padding: var(--openui-space-m, 12px);
    border-radius: var(--openui-radius-m, 8px);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    gap: var(--openui-space-2xs, 4px);
    align-items: center;
    background-color: var(
      --_openui-toggle-item-bg,
      var(--openui-foreground, oklch(0.994 0 89.876 / 1))
    );
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));

    &[data-state="on"] {
      --_openui-toggle-item-bg: var(
        --openui-interactive-accent-default,
        oklch(0.546 0.215 262.881 / 1)
      );
      --_openui-toggle-item-hover-bg: var(
        --openui-interactive-accent-hover,
        oklch(0.546 0.215 262.881 / 0.8)
      );
      --_openui-toggle-item-disabled-color: var(
        --openui-text-accent-primary,
        oklch(0.994 0 89.876 / 1)
      );
      --_openui-toggle-item-disabled-opacity: 0.5;
      color: var(--openui-text-accent-primary, oklch(0.994 0 89.876 / 1));
    }
    &:hover {
      background-color: var(
        --_openui-toggle-item-hover-bg,
        var(--openui-sunk, oklch(0.097 0 0 / 0.04))
      );
    }
    &:disabled {
      color: var(
        --_openui-toggle-item-disabled-color,
        var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2))
      );
      border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      cursor: not-allowed;
      opacity: var(--_openui-toggle-item-disabled-opacity, 1);
    }
  `,
};
