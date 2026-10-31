import { css } from "../../styles/css";

/** Button's stable classes: the public override targets. */
export const names = {
  root: "openui-button",
  icon: "openui-button-icon",
  variant: {
    primary: "openui-button--variant-primary",
    secondary: "openui-button--variant-secondary",
    tertiary: "openui-button--variant-tertiary",
  },
  size: {
    "extra-small": "openui-button--size-extra-small",
    small: "openui-button--size-small",
    medium: "openui-button--size-medium",
    large: "openui-button--size-large",
  },
  tone: {
    default: "openui-button--tone-default",
    destructive: "openui-button--tone-destructive",
  },
} as const;

// Existing --openui-* variables and light defaults; no runtime theme-table import.
const smallText = `
  font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
  letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

const shadowM = `var(--openui-shadow-m, 0 4px 6px -2px oklch(0 0 0 / 0.025), 0 2px 2px -2px oklch(0 0 0 / 0.05))`;
const highlight = `var(--openui-highlight, oklch(0.097 0 0 / 0.04))`;
const textNeutralPrimary = `var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1))`;
const textNeutralTertiary = `var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2))`;
const textDangerPrimary = `var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1))`;
const textDangerTertiary = `var(--openui-text-danger-tertiary, oklch(0.808 0.103 19.571 / 1))`;
const destructiveHover = `var(--openui-interactive-destructive-hover, oklch(0.577 0.215 27.325 / 0.08))`;
const borderInteractive = `var(--openui-border-interactive, oklch(0.097 0 0 / 0.12))`;
const borderDanger = `var(--openui-border-danger, oklch(0.577 0.215 27.325 / 0.08))`;

/**
 * Rules are flat: each is one generated class, plus one state at most. Variants read colours from
 * private `--_openui-button-*` variables that the tone sets, so tone × variant needs no compound
 * selector. Within a variant, `:disabled` comes last and restates everything hover and press
 * change, so a disabled button ignores both. Equal-weight rules on one element resolve by
 * registration order (root, then variant, size, tone), so keep each body specific to Button:
 * Goober gives an identical body registered earlier elsewhere that earlier class and position.
 */
export const buttonStyles = {
  root: css`
    box-sizing: border-box;
    font: var(--openui-text-label-default, 400 16px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    border-radius: var(--openui-radius-l, 10px);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.12s ease;
    display: flex;
    gap: var(--openui-space-xs, 6px);
    align-items: center;
    :where(&) {
      svg {
        height: 1em;
        width: 1em;
      }
    }
  `,
  variant: {
    primary: css`
      background-color: var(--_openui-button-primary-bg);
      color: var(--_openui-button-primary-fg);
      border-color: var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
      box-shadow: var(--_openui-button-primary-shadow);
      &:hover {
        background-color: var(--_openui-button-primary-hover-bg);
        box-shadow: none;
      }
      &:active {
        background-color: var(--_openui-button-primary-active-bg);
      }
      &:disabled {
        background-color: var(--_openui-button-primary-disabled-bg);
        box-shadow: none;
        cursor: not-allowed;
      }
    `,
    secondary: css`
      background-color: var(--_openui-button-secondary-bg);
      color: var(--_openui-button-secondary-fg);
      border-color: var(--_openui-button-secondary-border);
      box-shadow: var(--_openui-button-secondary-shadow);
      &:hover {
        background-color: var(--_openui-button-secondary-hover-bg);
        box-shadow: none;
      }
      &:active {
        background-color: var(--_openui-button-secondary-active-bg);
      }
      &:disabled {
        background-color: var(--_openui-button-secondary-disabled-bg);
        color: var(--_openui-button-secondary-disabled-fg);
        box-shadow: none;
        cursor: not-allowed;
      }
    `,
    tertiary: css`
      background-color: transparent;
      color: var(--_openui-button-tertiary-fg);
      &:hover {
        background-color: var(--_openui-button-tertiary-hover-bg);
      }
      &:active {
        background-color: var(--_openui-button-tertiary-active-bg);
        border-color: var(--_openui-button-tertiary-active-border);
      }
      &:disabled {
        background-color: transparent;
        border-color: var(--_openui-button-tertiary-disabled-border);
        color: var(--_openui-button-tertiary-disabled-fg);
        cursor: not-allowed;
      }
    `,
  },
  size: {
    "extra-small": css`
      border-radius: var(--openui-radius-s, 6px);
      padding: calc(var(--openui-space-xs, 6px) - 1.75px) var(--openui-space-s, 8px);
      ${smallText}
    `,
    small: css`
      border-radius: calc(var(--openui-radius-s, 6px) + 1px);
      padding: calc(var(--openui-space-s, 8px) - 1.75px) var(--openui-space-s-m, 10px);
      ${smallText}
    `,
    medium: css`
      padding: calc(var(--openui-space-s, 8px) - 1px) var(--openui-space-s-m, 10px);
      border-radius: var(--openui-radius-m, 8px);
    `,
    large: css`
      padding: calc(var(--openui-space-s-m, 10px) - 1px) var(--openui-space-m, 12px);
    `,
  },
  tone: {
    default: css`
      --_openui-button-primary-bg: var(
        --openui-interactive-accent-default,
        oklch(0.546 0.215 262.881 / 1)
      );
      --_openui-button-primary-fg: var(--openui-text-accent-primary, oklch(0.994 0 89.876 / 1));
      --_openui-button-primary-shadow: ${shadowM};
      --_openui-button-primary-hover-bg: var(
        --openui-interactive-accent-hover,
        oklch(0.546 0.215 262.881 / 0.8)
      );
      --_openui-button-primary-active-bg: var(
        --openui-interactive-accent-pressed,
        oklch(0.546 0.215 262.881 / 1)
      );
      --_openui-button-primary-disabled-bg: var(
        --openui-interactive-accent-disabled,
        oklch(0.546 0.215 262.881 / 0.4)
      );
      --_openui-button-secondary-bg: transparent;
      --_openui-button-secondary-fg: ${textNeutralPrimary};
      --_openui-button-secondary-border: ${borderInteractive};
      --_openui-button-secondary-shadow: ${shadowM};
      --_openui-button-secondary-hover-bg: ${highlight};
      --_openui-button-secondary-active-bg: ${highlight};
      --_openui-button-secondary-disabled-bg: transparent;
      --_openui-button-secondary-disabled-fg: ${textNeutralTertiary};
      --_openui-button-tertiary-fg: ${textNeutralPrimary};
      --_openui-button-tertiary-hover-bg: ${highlight};
      --_openui-button-tertiary-active-bg: ${highlight};
      --_openui-button-tertiary-active-border: ${borderInteractive};
      --_openui-button-tertiary-disabled-fg: ${textNeutralTertiary};
      --_openui-button-tertiary-disabled-border: var(
        --openui-border-default,
        oklch(0.097 0 0 / 0.06)
      );
    `,
    destructive: css`
      --_openui-button-primary-bg: var(
        --openui-interactive-destructive-accent-default,
        oklch(0.577 0.215 27.325 / 1)
      );
      --_openui-button-primary-fg: var(
        --openui-text-danger-inverted-primary,
        oklch(0.982 0.009 17.303 / 1)
      );
      --_openui-button-primary-shadow: none;
      --_openui-button-primary-hover-bg: var(
        --openui-interactive-destructive-accent-hover,
        oklch(0.637 0.208 25.331 / 1)
      );
      --_openui-button-primary-active-bg: var(
        --openui-interactive-destructive-accent-pressed,
        oklch(0.505 0.19 27.518 / 1)
      );
      --_openui-button-primary-disabled-bg: var(
        --openui-interactive-destructive-accent-disabled,
        oklch(0.577 0.215 27.325 / 0.4)
      );
      --_openui-button-secondary-bg: var(
        --openui-interactive-destructive-default,
        oklch(0.577 0.215 27.325 / 0.02)
      );
      --_openui-button-secondary-fg: ${textDangerPrimary};
      --_openui-button-secondary-border: ${borderDanger};
      --_openui-button-secondary-shadow: none;
      --_openui-button-secondary-hover-bg: ${destructiveHover};
      --_openui-button-secondary-active-bg: ${destructiveHover};
      --_openui-button-secondary-disabled-bg: var(
        --openui-interactive-destructive-disabled,
        oklch(0.577 0.215 27.325 / 0.02)
      );
      --_openui-button-secondary-disabled-fg: ${textDangerTertiary};
      --_openui-button-tertiary-fg: ${textDangerPrimary};
      --_openui-button-tertiary-hover-bg: ${destructiveHover};
      --_openui-button-tertiary-active-bg: ${destructiveHover};
      --_openui-button-tertiary-active-border: ${borderDanger};
      --_openui-button-tertiary-disabled-fg: ${textDangerTertiary};
      --_openui-button-tertiary-disabled-border: transparent;
    `,
  },
  icon: css`
    display: inline-flex;
  `,
};
