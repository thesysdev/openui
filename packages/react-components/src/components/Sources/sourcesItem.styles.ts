import { css } from "../../styles/css";

export const names = {
  root: "openui-sources-item",
  header: "openui-sources-item-header",
  name: "openui-sources-item-name",
  title: "openui-sources-item-title",
  logo: "openui-sources-item-logo",
} as const;

export const sourcesItemStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--openui-space-2xs, 4px);
    padding: var(--openui-space-s, 8px);
    height: 100%;
  `,
  linked: css`
    /* Sources linked item: do not share Calendar's cursor-only rule position. */
    cursor: pointer;
  `,
  header: css`
    display: flex;
    align-items: flex-start;
    gap: var(--openui-space-s, 8px);
  `,
  name: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  title: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  logo: css`
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-s, 6px);
    box-sizing: border-box;
    overflow: hidden;
  `,
};
