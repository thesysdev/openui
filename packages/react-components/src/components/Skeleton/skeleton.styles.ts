import { css } from "../../styles/css";

export const names = {
  root: "openui-skeleton",
  bar: "openui-skeleton-bar",
} as const;

export const skeletonStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-s, 8px);
  `,
};

export const skeletonBarStyles = {
  root: css`
    background-color: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    border-radius: var(--_openui-skeleton-bar-border-radius, var(--openui-radius-s, 6px));
    height: var(--_openui-skeleton-bar-height);
    width: var(--_openui-skeleton-bar-width);
  `,
};
