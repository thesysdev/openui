import { css } from "../../styles/css";

export const names = {
  root: "openui-table-head",
  label: "openui-table-head-label",
  content: "openui-table-head-content",
  icon: "openui-table-head-icon",
  align: {
    left: "openui-table-head--align-left",
    center: "openui-table-head--align-center",
    right: "openui-table-head--align-right",
  },
} as const;
export const tableHeadStyles = {
  root: css`
    padding-top: var(--openui-space-m, 12px);
    padding-bottom: var(--openui-space-m, 12px);
    padding-left: var(--openui-space-m, 12px);
    padding-right: var(--openui-space-m, 12px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));

    border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
  `,
  label: css`
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    display: inline-flex;
    flex-grow: 1;
    justify-content: var(--_openui-table-head-label-justify, left);
  `,
  content: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-2xs, 4px);
    text-align: var(--_openui-table-head-align, inherit);
    justify-content: var(--_openui-table-head-justify, normal);
  `,
  icon: css`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  align: {
    left: css`
      --_openui-table-head-align: left;
      --_openui-table-head-justify: flex-start;
      --_openui-table-head-label-justify: left;
    `,
    center: css`
      --_openui-table-head-align: center;
      --_openui-table-head-justify: center;
      --_openui-table-head-label-justify: center;
    `,
    right: css`
      --_openui-table-head-align: right;
      --_openui-table-head-justify: flex-end;
      --_openui-table-head-label-justify: flex-end;
    `,
  },
};
