import { css } from "goober";
import { tokens } from "../../shared/tokens";

const FILL = `var(--_openui-intelligent-segment-fill, ${tokens.canvas})`;

export const names = {
  root: "openui-intelligent-segmented-control",
  block: "openui-intelligent-segmented-control--block",
  option: "openui-intelligent-segmented-control-option",
} as const;

/**
 * Each option is the kit's Button (ghost, small) reshaped into a segment: muted text and no hover
 * fill until chosen, then a raised pill. Colours go through its tokens; what Button and
 * react-components set themselves is overridden with all three classes.
 */
export const styles = {
  root: css`
    display: inline-flex;
    align-self: flex-start;
    gap: 2px;
    max-width: 100%;
    padding: 3px;
    overflow-x: auto;
    border-radius: 999px;
    background: ${tokens.surface};
    scrollbar-width: none;
  `,
  block: css`
    display: flex;
    width: 100%;
    align-self: stretch;
  `,
  option: css`
    &.openui-button {
      --openui-text-neutral-primary: ${tokens.muted};
      --openui-highlight: transparent;
    }
    &.openui-button:hover {
      --openui-text-neutral-primary: ${tokens.ink};
    }
    &.openui-button[aria-checked="true"] {
      --openui-text-neutral-primary: ${tokens.ink};
      --openui-highlight: ${FILL};
    }
    &.openui-button.openui-intelligent-button {
      flex: 1 0 auto;
      min-height: 0;
      padding: 6px 14px;
      border-width: 0;
      font-size: 13px;
      line-height: 1.4;
      font-weight: 400;
      transition: background-color 0.2s, color 0.2s;
      @media (max-width: 640px) {
        padding: 6px 11px;
      }
    }
    &.openui-button.openui-intelligent-button[aria-checked="true"] {
      background-color: ${FILL};
      font-weight: 560;
      box-shadow: ${tokens.shadowSm}, 0 0 0 1px ${tokens.border};
    }
  `,
};
