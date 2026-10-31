import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-button",
  icon: "openui-intelligent-button-icon",
  block: "openui-intelligent-button--block",
  size: {
    sm: "openui-intelligent-button--size-sm",
    md: "openui-intelligent-button--size-md",
    lg: "openui-intelligent-button--size-lg",
  },
  variant: {
    solid: "openui-intelligent-button--variant-solid",
    outline: "openui-intelligent-button--variant-outline",
    soft: "openui-intelligent-button--variant-soft",
    ghost: "openui-intelligent-button--variant-ghost",
  },
  color: {
    danger: "openui-intelligent-button--color-danger",
    success: "openui-intelligent-button--color-success",
  },
} as const;

const HOVER_FILTER = "--_openui-intelligent-button-hover-filter";

/**
 * Button is react-components' Button with the Intelligent UI look. It reads its look from
 * --openui-* tokens, so these point them at the kit's: a pill, 560 weight, the kit's sizes, ink for
 * solid, the kit's danger and success, no shadow. What it sets itself is overridden with the kit
 * class plus its stable class (`&.openui-button`): its rules register later, so one class would lose.
 */
export const styles = {
  root: css`
    --openui-text-label-default: 560 14px/1.2 ${tokens.font};
    --openui-text-label-sm: 560 13px/1.2 ${tokens.font};
    --openui-text-label-default-letter-spacing: normal;
    --openui-text-label-sm-letter-spacing: normal;
    --openui-font-variation-regular: normal;
    --openui-radius-s: 999px;
    --openui-radius-m: 999px;
    --openui-radius-l: 999px;
    --openui-space-xs: 7px;
    --openui-shadow-m: none;
    --openui-text-neutral-primary: ${tokens.ink};
    --openui-text-neutral-tertiary: ${tokens.ink};
    --openui-border-interactive: ${tokens.border};
    --openui-border-default: transparent;
    --openui-highlight: ${tokens.hover};
    /* Inline, so a button can sit in a line of text; and only colours animate, so the focus ring
       appears at once rather than easing in with \`all\`. */
    &.openui-button {
      display: inline-flex;
      justify-content: center;
      align-self: flex-start;
      flex: none;
      min-height: 36px;
      white-space: nowrap;
      font-family: inherit;
      transition: background-color 0.15s, border-color 0.15s, color 0.15s;
    }
    /* In a Row, which is not flat because the Button is the model's child. */
    .openui-intelligent-row > &.openui-button {
      align-self: center;
    }
    &.openui-button:disabled {
      opacity: 0.4;
    }
    &.openui-button:focus-visible {
      outline: 2px solid ${tokens.focus};
      outline-offset: 3px;
    }
  `,
  icon: css`
    width: var(--_openui-intelligent-button-icon-size, 16px);
    height: var(--_openui-intelligent-button-icon-size, 16px);
  `,
  block: css`
    &.openui-button {
      width: 100%;
      align-self: stretch;
    }
  `,
  size: {
    sm: css`
      --_openui-intelligent-button-icon-size: 14px;
      --openui-space-s-m: 12px;
      &.openui-button {
        min-height: 32px;
      }
    `,
    md: css`
      --openui-space-s-m: 16px;
    `,
    lg: css`
      --openui-space-m: 20px;
      --openui-text-label-default: 560 15px/1.2 ${tokens.font};
      &.openui-button {
        min-height: 44px;
      }
    `,
  },
  /* Outline and soft fill what react-components leaves transparent, except on hover and press, which
     stay its own. Pressed is the kit's 8%, where react-components reuses the 5% hover. */
  variant: {
    solid: css`
      --openui-interactive-accent-default: ${tokens.ink};
      --openui-interactive-accent-hover: ${tokens.inkHover};
      --openui-interactive-accent-pressed: ${tokens.inkHover};
      --openui-interactive-accent-disabled: ${tokens.ink};
      --openui-text-accent-primary: ${tokens.onInk};
      --openui-border-accent: transparent;
      &.openui-button:hover:not(:disabled) {
        filter: var(${HOVER_FILTER}, none);
      }
    `,
    outline: css`
      &.openui-button:not(:hover,:active),
      &.openui-button:disabled {
        background-color: ${tokens.canvas};
      }
      &:active {
        --openui-highlight: ${tokens.pressed};
      }
    `,
    soft: css`
      --openui-highlight: ${tokens.pressed};
      --openui-border-interactive: transparent;
      &.openui-button:not(:hover,:active),
      &.openui-button:disabled {
        background-color: ${tokens.surface};
      }
    `,
    ghost: css`
      --openui-space-s-m: 10px;
      --openui-space-m: 10px;
      --openui-border-interactive: transparent;
      &:active {
        --openui-highlight: ${tokens.pressed};
      }
    `,
  },
  color: {
    danger: css`
      ${HOVER_FILTER}: brightness(1.08);
      --openui-interactive-accent-default: ${tokens.danger};
      --openui-interactive-accent-hover: ${tokens.danger};
      --openui-interactive-accent-pressed: ${tokens.danger};
      --openui-interactive-accent-disabled: ${tokens.danger};
      --openui-text-accent-primary: var(--_openui-intelligent-button-on-status, #fff);
      --openui-text-neutral-primary: ${tokens.danger};
      --openui-text-neutral-tertiary: ${tokens.danger};
    `,
    success: css`
      ${HOVER_FILTER}: brightness(1.08);
      --openui-interactive-accent-default: ${tokens.success};
      --openui-interactive-accent-hover: ${tokens.success};
      --openui-interactive-accent-pressed: ${tokens.success};
      --openui-interactive-accent-disabled: ${tokens.success};
      --openui-text-accent-primary: var(--_openui-intelligent-button-on-status, #fff);
      --openui-text-neutral-primary: ${tokens.success};
      --openui-text-neutral-tertiary: ${tokens.success};
    `,
  },
};
