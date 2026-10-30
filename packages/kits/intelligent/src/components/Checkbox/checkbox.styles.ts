import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { root: "openui-intelligent-checkbox" } as const;

/** The label is react-components', so striking it through goes by its stable class. */
export const styles = {
  root: css`
    display: inline-flex;
    flex-direction: column;
    gap: 6px;
    &[data-done] {
      align-items: center;
      min-height: 28px;
      color: ${tokens.ink};
      cursor: pointer;
    }
    &[data-done] .openui-check-box-item-label {
      color: ${tokens.muted};
      text-decoration: line-through;
    }
  `,
};
