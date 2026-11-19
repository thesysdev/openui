import { css } from "../../styles/css";

export const names = {
  root: "openui-buttons",
  variant: {
    horizontal: "openui-buttons--variant-horizontal",
    vertical: "openui-buttons--variant-vertical",
  },
} as const;

export const buttonsStyles = {
  root: css`
    display: flex;
    width: 100%;
    gap: var(--openui-space-m, 12px);
  `,
  variant: {
    horizontal: css`
      flex-direction: row;
      flex-wrap: wrap;
    `,
    vertical: css`
      flex-direction: column;
    `,
  },
};
