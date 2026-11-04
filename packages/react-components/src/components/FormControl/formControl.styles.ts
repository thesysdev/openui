import { css } from "../../styles/css";

export const names = { root: "openui-form-control" } as const;

export const formControlStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-s, 8px);
  `,
};
