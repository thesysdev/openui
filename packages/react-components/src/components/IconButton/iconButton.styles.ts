import { css } from "../../styles/css";

/** IconButton's stable classes: the public override targets. */
export const names = {
  root: "openui-icon-button",
  icon: "openui-icon-button-icon",
  variant: {
    primary: "openui-icon-button--variant-primary",
    secondary: "openui-icon-button--variant-secondary",
    tertiary: "openui-icon-button--variant-tertiary",
  },
  size: {
    "3-extra-small": "openui-icon-button--size-3-extra-small",
    "2-extra-small": "openui-icon-button--size-2-extra-small",
    "extra-small": "openui-icon-button--size-extra-small",
    small: "openui-icon-button--size-small",
    medium: "openui-icon-button--size-medium",
    large: "openui-icon-button--size-large",
  },
  shape: {
    square: "openui-icon-button--shape-square",
    circle: "openui-icon-button--shape-circle",
  },
  tone: {
    default: "openui-icon-button--tone-default",
    destructive: "openui-icon-button--tone-destructive",
  },
} as const;

// Existing --openui-* variables and light defaults; no runtime theme-table import.
const shadowM = `var(--openui-shadow-m, 0 4px 6px -2px oklch(0 0 0 / 0.025), 0 2px 2px -2px oklch(0 0 0 / 0.05))`;
const highlight = `var(--openui-highlight, oklch(0.097 0 0 / 0.04))`;
const textNeutralPrimary = `var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1))`;
const textNeutralTertiary = `var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2))`;
const textDangerPrimary = `var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1))`;
const textDangerTertiary = `var(--openui-text-danger-tertiary, oklch(0.808 0.103 19.571 / 1))`;
const destructiveHover = `var(--openui-interactive-destructive-hover, oklch(0.577 0.215 27.325 / 0.08))`;
const borderInteractive = `var(--openui-border-interactive, oklch(0.097 0 0 / 0.12))`;
const borderDanger = `var(--openui-border-danger, oklch(0.577 0.215 27.325 / 0.08))`;
const radiusS = `var(--openui-radius-s, 6px)`;

/**
 * Rules are flat: each is one generated class, plus one state at most. Variants read colours from
 * private `--_openui-icon-button-*` variables that the tone sets, so tone × variant needs no
 * compound selector; the size sets the icon part's size and the square shape's radius the same
 * way. Within a variant, `:disabled` comes last and restates everything hover and press change, so
 * a disabled button ignores both. Equal-weight rules on one element resolve by registration order
 * (root, then variant, size, shape, tone), so keep each body specific to IconButton: Goober gives
 * an identical body registered earlier elsewhere that earlier class and position.
 */
export const iconButtonStyles = {
  root: css`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.12s ease;
    padding: 0;
    flex-shrink: 0;
  `,
  variant: {
    primary: css`
      background-color: var(--_openui-icon-button-primary-bg);
      color: var(--_openui-icon-button-primary-fg);
      border-color: var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
      box-shadow: var(--_openui-icon-button-primary-shadow);
      &:hover {
        background-color: var(--_openui-icon-button-primary-hover-bg);
        box-shadow: none;
      }
      &:active {
        background-color: var(--_openui-icon-button-primary-active-bg);
      }
      &:disabled {
        background-color: var(--_openui-icon-button-primary-disabled-bg);
        box-shadow: none;
        cursor: not-allowed;
      }
    `,
    secondary: css`
      background-color: var(--_openui-icon-button-secondary-bg);
      color: var(--_openui-icon-button-secondary-fg);
      border-color: var(--_openui-icon-button-secondary-border);
      box-shadow: var(--_openui-icon-button-secondary-shadow);
      &:hover {
        background-color: var(--_openui-icon-button-secondary-hover-bg);
        box-shadow: none;
      }
      &:active {
        background-color: var(--_openui-icon-button-secondary-active-bg);
      }
      &:disabled {
        background-color: var(--_openui-icon-button-secondary-disabled-bg);
        color: var(--_openui-icon-button-secondary-disabled-fg);
        box-shadow: none;
        cursor: not-allowed;
      }
    `,
    tertiary: css`
      background-color: transparent;
      color: var(--_openui-icon-button-tertiary-fg);
      &:hover {
        background-color: var(--_openui-icon-button-tertiary-hover-bg);
      }
      &:active {
        background-color: var(--_openui-icon-button-tertiary-active-bg);
        border-color: var(--_openui-icon-button-tertiary-active-border);
      }
      &:disabled {
        background-color: transparent;
        border-color: var(--_openui-icon-button-tertiary-disabled-border);
        color: var(--_openui-icon-button-tertiary-disabled-fg);
        cursor: not-allowed;
      }
    `,
  },
  size: {
    "3-extra-small": css`
      width: 20px;
      height: 20px;
      --_openui-icon-button-icon-size: 10px;
      --_openui-icon-button-square-radius: ${radiusS};
    `,
    "2-extra-small": css`
      width: 24px;
      height: 24px;
      --_openui-icon-button-icon-size: 12px;
      --_openui-icon-button-square-radius: calc(${radiusS} - 1px);
    `,
    "extra-small": css`
      width: 28px;
      height: 28px;
      --_openui-icon-button-icon-size: 14px;
      --_openui-icon-button-square-radius: ${radiusS};
    `,
    small: css`
      width: 32px;
      height: 32px;
      --_openui-icon-button-icon-size: 16px;
      --_openui-icon-button-square-radius: calc(${radiusS} + 1px);
    `,
    medium: css`
      width: 36px;
      height: 36px;
      --_openui-icon-button-icon-size: 16px;
      --_openui-icon-button-square-radius: var(--openui-radius-m, 8px);
    `,
    large: css`
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      font-size: 16px;
      --_openui-icon-button-icon-size: 16px;
      --_openui-icon-button-square-radius: var(--openui-radius-l, 10px);
    `,
  },
  shape: {
    square: css`
      border-radius: var(--_openui-icon-button-square-radius);
    `,
    circle: css`
      border-radius: var(--openui-radius-full, 9999px);
    `,
  },
  tone: {
    default: css`
      --_openui-icon-button-primary-bg: var(
        --openui-interactive-accent-default,
        oklch(0.546 0.215 262.881 / 1)
      );
      --_openui-icon-button-primary-fg: var(
        --openui-text-accent-primary,
        oklch(0.994 0 89.876 / 1)
      );
      --_openui-icon-button-primary-shadow: ${shadowM};
      --_openui-icon-button-primary-hover-bg: var(
        --openui-interactive-accent-hover,
        oklch(0.546 0.215 262.881 / 0.8)
      );
      --_openui-icon-button-primary-active-bg: var(
        --openui-interactive-accent-pressed,
        oklch(0.546 0.215 262.881 / 1)
      );
      --_openui-icon-button-primary-disabled-bg: var(
        --openui-interactive-accent-disabled,
        oklch(0.546 0.215 262.881 / 0.4)
      );
      --_openui-icon-button-secondary-bg: transparent;
      --_openui-icon-button-secondary-fg: ${textNeutralPrimary};
      --_openui-icon-button-secondary-border: ${borderInteractive};
      --_openui-icon-button-secondary-shadow: ${shadowM};
      --_openui-icon-button-secondary-hover-bg: ${highlight};
      --_openui-icon-button-secondary-active-bg: ${highlight};
      --_openui-icon-button-secondary-disabled-bg: transparent;
      --_openui-icon-button-secondary-disabled-fg: ${textNeutralTertiary};
      --_openui-icon-button-tertiary-fg: ${textNeutralPrimary};
      --_openui-icon-button-tertiary-hover-bg: ${highlight};
      --_openui-icon-button-tertiary-active-bg: ${highlight};
      --_openui-icon-button-tertiary-active-border: ${borderInteractive};
      --_openui-icon-button-tertiary-disabled-fg: ${textNeutralTertiary};
      --_openui-icon-button-tertiary-disabled-border: var(
        --openui-border-default,
        oklch(0.097 0 0 / 0.06)
      );
    `,
    destructive: css`
      --_openui-icon-button-primary-bg: var(
        --openui-interactive-destructive-accent-default,
        oklch(0.577 0.215 27.325 / 1)
      );
      --_openui-icon-button-primary-fg: var(
        --openui-text-danger-inverted-primary,
        oklch(0.982 0.009 17.303 / 1)
      );
      --_openui-icon-button-primary-shadow: none;
      --_openui-icon-button-primary-hover-bg: var(
        --openui-interactive-destructive-accent-hover,
        oklch(0.637 0.208 25.331 / 1)
      );
      --_openui-icon-button-primary-active-bg: var(
        --openui-interactive-destructive-accent-pressed,
        oklch(0.505 0.19 27.518 / 1)
      );
      --_openui-icon-button-primary-disabled-bg: var(
        --openui-interactive-destructive-accent-disabled,
        oklch(0.577 0.215 27.325 / 0.4)
      );
      --_openui-icon-button-secondary-bg: var(
        --openui-interactive-destructive-default,
        oklch(0.577 0.215 27.325 / 0.02)
      );
      --_openui-icon-button-secondary-fg: ${textDangerPrimary};
      --_openui-icon-button-secondary-border: ${borderDanger};
      --_openui-icon-button-secondary-shadow: none;
      --_openui-icon-button-secondary-hover-bg: ${destructiveHover};
      --_openui-icon-button-secondary-active-bg: ${destructiveHover};
      --_openui-icon-button-secondary-disabled-bg: var(
        --openui-interactive-destructive-disabled,
        oklch(0.577 0.215 27.325 / 0.02)
      );
      --_openui-icon-button-secondary-disabled-fg: ${textDangerTertiary};
      --_openui-icon-button-tertiary-fg: ${textDangerPrimary};
      --_openui-icon-button-tertiary-hover-bg: ${destructiveHover};
      --_openui-icon-button-tertiary-active-bg: ${destructiveHover};
      --_openui-icon-button-tertiary-active-border: ${borderDanger};
      --_openui-icon-button-tertiary-disabled-fg: ${textDangerTertiary};
      --_openui-icon-button-tertiary-disabled-border: transparent;
    `,
  },
  icon: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--_openui-icon-button-icon-size);
    height: var(--_openui-icon-button-icon-size);
  `,
};
