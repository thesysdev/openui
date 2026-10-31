import { css } from "../../styles/css";

export const names = {
  root: "openui-table-skeleton",
  row: "openui-table-skeleton-row",
  cell: "openui-table-skeleton-cell",
  headerCell: "openui-table-skeleton-header-cell",
} as const;

export const tableSkeletonStyles = {
  root: css`
    padding: var(--openui-space-s, 8px) 0;
  `,
  row: css`
    display: grid;
    grid-template-columns: repeat(var(--_openui-table-skeleton-columns), 1fr);
    gap: var(--openui-space-m, 12px);
    padding: var(--openui-space-s-m, 10px) var(--openui-space-m, 12px);
    border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    &:last-child {
      border-bottom: 0;
    }
  `,
  cell: css`
    height: 14px;
  `,
  headerCell: css`
    width: 60%;
  `,
};
