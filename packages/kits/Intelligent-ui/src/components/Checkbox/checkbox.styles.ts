import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { root: "openui-intelligent-checkbox" } as const;

/** The box and label are react-components', so they go by their stable classes. */
export const styles = {
  root: css`
    display: inline-flex;
    flex-direction: column;
    gap: 6px;
    & .openui-check-box-item-container {
      align-items: center;
      gap: 9px;
      min-height: 28px;
      padding: 0;
    }
    & .openui-check-box-item {
      width: 17px;
      height: 17px;
      margin: 0;
      border-color: ${tokens.muted};
      border-radius: 3px;
    }
    & .openui-check-box-item[data-state="checked"] {
      border-color: ${tokens.ink};
      background-color: ${tokens.ink};
    }
    & .openui-check-box-item-indicator {
      color: ${tokens.onInk};
    }
    & .openui-check-box-item-label {
      font: inherit;
      letter-spacing: inherit;
      color: ${tokens.ink};
    }
    &[data-done] .openui-check-box-item-label {
      color: ${tokens.muted};
      text-decoration: line-through;
    }
  `,
};
