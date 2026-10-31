import { css } from "../../styles/css";

export const names = { root: "openui-border-box" } as const;

// Explicit opt-in preserves the three roots' existing applicability. The shared rule registers
// at import and follows the app-wide layer when the sheet is written.
export const baseStyles = {
  root: css`
    box-sizing: border-box;
  `,
};
