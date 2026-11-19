import { css } from "../../styles/css";

export const names = {
  root: "openui-scrollable-table",
  wrapper: "openui-scrollable-table-wrapper",
  scrollContainer: "openui-scrollable-table-scroll-container",
  control: "openui-scrollable-table-control",
  icon: "openui-scrollable-table-icon",
} as const;
export const scrollableTableStyles = {
  root: css`
    width: 100%;
    &[data-scrollable="true"] {
      width: max-content;
    }
  `,
  wrapper: css`
    position: relative;
    width: 100%;
    outline: none;
  `,
  scrollContainer: css`
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
    z-index: 2;
    width: fit-content;
    height: fit-content;
    border-radius: var(--openui-radius-s, 6px);
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    &[data-side="left"] {
      left: var(--openui-space-s, 8px);
    }
    &[data-side="right"] {
      right: var(--openui-space-s, 8px);
    }
    &[data-disabled="true"] {
      display: none;
    }
  `,
};
