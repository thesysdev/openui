import { css } from "../../styles/css";

export const names = {
  root: "openui-inline-header",
  heading: "openui-inline-header-heading",
  description: "openui-inline-header-description",
} as const;

export const inlineHeaderStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs, 2px);
    align-items: flex-start;
  `,
  heading: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-xs, 6px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-body-default-heavy, 560 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
  `,
  description: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
};
