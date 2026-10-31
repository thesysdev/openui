import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-icon-button",
  variant: {
    outline: "openui-intelligent-icon-button--variant-outline",
    ghost: "openui-intelligent-icon-button--variant-ghost",
    solid: "openui-intelligent-icon-button--variant-solid",
  },
} as const;

/**
 * IconButton is react-components' IconButton. These point its colour tokens at the kit's, so it
 * follows the kit's light and dark themes even without a host OpenUI theme: solid is ink rather than
 * the blue accent, and ghost is muted.
 */
export const styles = {
  root: css`
    --openui-text-neutral-primary: ${tokens.ink};
    --openui-border-interactive: ${tokens.border};
    --openui-highlight: ${tokens.hover};
    &.openui-icon-button:focus-visible {
      outline: 2px solid ${tokens.focus};
      outline-offset: 3px;
    }
  `,
  variant: {
    ghost: css`
      --openui-text-neutral-primary: ${tokens.muted};
    `,
    solid: css`
      --openui-interactive-accent-default: ${tokens.ink};
      --openui-interactive-accent-hover: ${tokens.inkHover};
      --openui-interactive-accent-pressed: ${tokens.ink};
      --openui-interactive-accent-disabled: ${tokens.ink};
      --openui-text-accent-primary: ${tokens.onInk};
      --openui-border-accent: ${tokens.ink};
    `,
  },
};
