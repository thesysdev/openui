import { css } from "../../../../styles/css";

export const names = {
  cell: "openui-editable-table-cell-base",
  input: "openui-editable-table-cell-input",
  text: "openui-editable-table-display-text",
  number: "openui-editable-table-display-number",
  url: "openui-editable-table-display-url",
  urlContainer: "openui-editable-table-display-url-container",
  urlIcon: "openui-editable-table-display-url-icon",
  warning: "openui-editable-table-display-url-warning-icon",
  warningContainer: "openui-editable-table-display-url-warning",
  top: "openui-editable-table-cell-outline-top",
  bottom: "openui-editable-table-cell-outline-bottom",
  left: "openui-editable-table-cell-outline-left",
  right: "openui-editable-table-cell-outline-right",
} as const;
export const editableCellStyles = {
  cell: css`
    box-sizing: content-box;
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--openui-space-s, 8px) var(--openui-space-m, 12px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));

    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);

    outline: none;
  `,
  input: css`
    height: 100%;
    width: 100%;
    padding: 0;
    background-color: transparent;
    outline: none;
    appearance: textfield;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      appearance: none;
    }
  `,
  text: css`
    position: absolute;
    width: calc(100% - var(--openui-space-m, 12px) * 2);
    left: var(--openui-space-m, 12px);
    top: 50%;
    transform: translateY(-50%);

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  number: css`
    position: absolute;
    width: calc(100% - var(--openui-space-m, 12px) * 2);
    left: var(--openui-space-m, 12px);
    top: 50%;
    transform: translateY(-50%);

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    text-align: right;
    font: var(--openui-text-numbers-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-numbers-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  url: css`
    display: block;
    flex: 1 1 auto;
    min-width: 0;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);

    &:hover {
      text-decoration: underline;
    }
  `,
  urlContainer: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s, 8px);

    position: absolute;
    width: calc(100% - var(--openui-space-m, 12px) * 2);
    left: var(--openui-space-m, 12px);
    top: 50%;
    transform: translateY(-50%);
  `,
  urlIcon: css`
    flex-shrink: 0;
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  warning: css`
    flex-shrink: 0;
    color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
    display: none;
  `,
  horizontalOutline: css`
    position: absolute;
    left: 0;
    width: 100%;
    height: 0px;
    background-color: var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
    &[data-state="selected"] {
      height: 1px;
    }
    &[data-state="editing"] {
      height: 1.5px;
    }
  `,
  verticalOutline: css`
    position: absolute;
    top: 0;
    width: 0px;
    height: 100%;
    background-color: var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
    &[data-state="selected"] {
      width: 1px;
    }
    &[data-state="editing"] {
      width: 1.5px;
    }
  `,
  top: css`
    top: 0;
  `,
  bottom: css`
    bottom: 0;
  `,
  left: css`
    left: 0;
  `,
  right: css`
    right: 0;
  `,
};
