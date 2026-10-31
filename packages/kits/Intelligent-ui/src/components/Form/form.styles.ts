import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { root: "openui-intelligent-form" } as const;

/** The closing action's extra space is not flat, because the children are the model's. */
export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: ${tokens.fieldGap};
    min-width: 0;
    & > .openui-intelligent-row:last-child:has(> .openui-intelligent-button),
    & > .openui-intelligent-button:last-child {
      margin-top: calc(${tokens.actionGap} - ${tokens.fieldGap});
    }
  `,
};
