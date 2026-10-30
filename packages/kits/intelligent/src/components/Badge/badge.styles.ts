import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-badge",
  color: {
    purple: "openui-intelligent-badge--color-purple",
    pink: "openui-intelligent-badge--color-pink",
  },
} as const;

/** The Row rule is not flat, because the Badge is the model's child there. */
export const styles = {
  root: css`
    .openui-intelligent-row > & {
      align-self: center;
      flex: none;
    }
  `,
  /* Purple and pink: react-components' Tag has no such variant, so the kit tints it. */
  color: {
    purple: css`
      &.openui-tag {
        background: ${tokens.badgePurpleSoft};
        color: ${tokens.badgePurple};
      }
    `,
    pink: css`
      &.openui-tag {
        background: ${tokens.badgePinkSoft};
        color: ${tokens.badgePink};
      }
    `,
  },
};
