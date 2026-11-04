import { css } from "../../styles/css";

export const names = {
  root: "openui-icon-text",
  content: "openui-icon-text-content",
  icon: "openui-icon-text-icon",
  layout: {
    horizontal: "openui-icon-text--layout-horizontal",
    vertical: "openui-icon-text--layout-vertical",
  },
  bold: { true: "openui-icon-text--bold" },
  overflow: {
    wrap: "openui-icon-text--overflow-wrap",
    truncate: "openui-icon-text--overflow-truncate",
  },
  width: { fill: "openui-icon-text--width-fill" },
  iconVariant: {
    neutral: "openui-icon-text--icon-variant-neutral",
    info: "openui-icon-text--icon-variant-info",
    success: "openui-icon-text--icon-variant-success",
    warning: "openui-icon-text--icon-variant-warning",
    danger: "openui-icon-text--icon-variant-danger",
    inverted: "openui-icon-text--icon-variant-inverted",
    filled: "openui-icon-text--icon-variant-filled",
    soft: "openui-icon-text--icon-variant-soft",
  },
} as const;
export const iconTextStyles = {
  root: css`
    display: flex;
    gap: var(--openui-space-m, 12px);
  `,
  // The composed IconTag, nudged down to the title's first line in the horizontal layout.
  icon: css`
    margin-top: var(--_openui-icon-text-icon-margin-top, 0px);
  `,
  content: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
  layout: {
    horizontal: css`
      flex-direction: row;
      align-items: flex-start;
      --_openui-icon-text-icon-margin-top: var(--openui-space-3xs, 2px);
    `,
    vertical: css`
      flex-direction: column;
      align-items: flex-start;
      --_openui-icon-text-icon-margin-top: 0px;
    `,
  },
  // As TextBlock's: a slot that truncates lets the row shrink; one that fills spans its container.
  overflow: {
    wrap: "",
    truncate: css`
      min-width: 0px;
      overflow: hidden;
    `,
  },
  width: {
    fill: css`
      width: 100%;
    `,
  },
};
