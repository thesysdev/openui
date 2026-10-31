import { css } from "../../styles/css";

export const names = {
  container: "openui-table-container",
  root: "openui-table",
  footer: "openui-table-footer",
  row: "openui-table-row",
  header: "openui-table-header",
  body: "openui-table-body",
} as const;
export const tableStyles = {
  container: css`
    position: relative;
    width: 100%;
    overflow: auto;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-2xl, 14px);
  `,
  root: css`
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);

    width: 100%;
    caption-side: bottom;
    border-collapse: collapse;
  `,
  footer: css`
    border-top: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
  `,
  row: css`
    border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    &:nth-child(even) {
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    }
    &:last-child {
      border-bottom: 0;
    }
  `,
};
