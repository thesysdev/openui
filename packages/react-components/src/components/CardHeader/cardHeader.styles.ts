import { css } from "../../styles/css";

export const names = {
  root: "openui-card-header",
  top: "openui-card-header-top",
  topLeft: "openui-card-header-top-left",
  topLeftIcon: "openui-card-header-top-left-icon",
  topRight: "openui-card-header-top-right",
  bottom: "openui-card-header-bottom",
} as const;
export const cardHeaderStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xs, 6px);
    margin-bottom: var(--openui-space-2xs, 4px);
    overflow-wrap: break-word;
  `,
  top: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  `,
  topLeft: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--openui-space-xs, 6px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-heading-sm, 600 18px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-heading-sm-letter-spacing, -0.01em);
  `,
  topLeftIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1em;
    width: 1em;
  `,
  topRight: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--openui-space-2xs, 4px);
  `,
  bottom: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
};
