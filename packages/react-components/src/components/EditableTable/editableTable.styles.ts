import { css } from "../../styles/css";

export const names = {
  scroll: "openui-editable-table-scroll-container",
  control: "openui-editable-table-scroll-control",
  table: "openui-editable-table-grid",
  header: "openui-editable-table-header-container",
  headerIcon: "openui-editable-table-header-icon",
  changes: "openui-editable-table-changes-container",
  changesCount: "openui-editable-table-changes-count",
  changesButtons: "openui-editable-table-changes-buttons",
  root: "openui-editable-table",
  head: "openui-editable-table-head",
  row: "openui-editable-table-row",
  cell: "openui-editable-table-cell",
  tableHeader: "openui-editable-table-grid-header",
  tableBody: "openui-editable-table-grid-body",
  headerRow: "openui-editable-table-header-row",
  icon: "openui-editable-table-icon",
} as const;
export const editableTableStyles = {
  scroll: css`
    overflow: auto;
    scrollbar-width: none;
    ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  `,
  control: css`
    position: absolute;
    top: var(--openui-space-s, 8px);
    z-index: 1;
    width: fit-content;
    height: fit-content;
    border-radius: var(--openui-radius-s, 6px);
    background-color: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    cursor: pointer;
    &[data-side="left"] {
      left: var(--openui-space-s, 8px);
    }
    &[data-side="right"] {
      right: var(--openui-space-s, 8px);
    }
    &[data-disabled="true"] {
      cursor: not-allowed;
      display: none;
    }
  `,
  table: css`
    border-collapse: collapse;
    width: 100%;
    &[data-scrollable="true"] {
      width: max-content;
    }
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
  `,
  headerIcon: css`
    flex-shrink: 0;
  `,
  changes: css`
    display: flex;
    flex-direction: row;
    gap: var(--openui-space-s, 8px);
    padding: var(--openui-space-s, 8px) var(--openui-space-s, 8px) var(--openui-space-s, 8px)
      var(--openui-space-m, 12px);
    justify-content: space-between;
    align-items: center;
    background-color: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    border-radius: var(--openui-radius-xl, 12px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
  `,
  changesCount: css`
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  changesButtons: css`
    display: flex;
    flex-direction: row;
    gap: var(--openui-space-s, 8px);
  `,
  root: css`
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-xl, 12px) var(--openui-radius-xl, 12px) 0 0;
    overflow: hidden;
    position: relative;
  `,
  head: css`
    box-sizing: content-box;
    text-align: left;
    padding: var(--openui-space-s, 8px) var(--openui-space-m, 12px);
    border-right: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));

    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    height: 48px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: var(--_openui-editable-table-column-width);
    &:last-child {
      border-right: 0;
    }
  `,
  row: css`
    border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    &:last-child {
      border-bottom: 0;
    }
  `,
  cell: css`
    box-sizing: content-box;
    height: 48px;
    padding: 0;
    border-right: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    vertical-align: middle;
    white-space: nowrap;
    width: var(--_openui-editable-table-column-width);
    &:last-child {
      border-right: 0;
    }
  `,
};
