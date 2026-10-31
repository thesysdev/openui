import { css } from "../../styles/css";

export const names = {
  root: "openui-tag-block",
} as const;

export const tagBlockStyles = {
  root: css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--openui-space-s, 8px);
    max-width: 100%;
  `,
};
