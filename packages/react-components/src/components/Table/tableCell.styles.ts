import { css } from "../../styles/css";

export const names = {
  root: "openui-table-cell",
  align: {
    left: "openui-table-cell--align-left",
    center: "openui-table-cell--align-center",
    right: "openui-table-cell--align-right",
  },
} as const;
export const tableCellStyles = {
  root: css`
    padding-top: var(--openui-space-m, 12px);
    padding-bottom: var(--openui-space-m, 12px);
    padding-left: var(--openui-space-m, 12px);
    padding-right: var(--openui-space-m, 12px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));

    white-space: nowrap;
  `,
  align: {
    left: css`
      text-align: left;
      justify-content: flex-start;
    `,
    center: css`
      text-align: center;
      justify-content: center;
    `,
    right: css`
      text-align: right;
      justify-content: flex-end;
    `,
  },
};
