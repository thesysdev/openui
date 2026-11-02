import { css } from "../../styles/css";

export const names = { root: "openui-separator" } as const;
export const separatorStyles = {
  root: css`
    background-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    &[data-orientation="horizontal"] {
      height: 1px;
      width: 100%;
    }
    &[data-orientation="vertical"] {
      width: 1px;
      height: 100%;
    }
  `,
};
