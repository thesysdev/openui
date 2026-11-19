import { css } from "../../../../styles/css";

// This cell owns its Radix parts, styled as table cells rather than as the Select family.
export const names = {
  trigger: "openui-editable-table-select-trigger",
  icon: "openui-editable-table-select-icon",
  content: "openui-editable-table-select-content",
  viewport: "openui-editable-table-select-viewport",
  item: "openui-editable-table-select-item",
  checkWrapper: "openui-editable-table-select-check-wrapper",
  checkIcon: "openui-editable-table-select-check-icon",
  itemText: "openui-editable-table-select-item-text",
  value: "openui-editable-table-select-value",
  indicator: "openui-editable-table-select-indicator",
} as const;
export const editableSelectCellStyles = {
  trigger: css`
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    width: 100%;
    box-sizing: border-box;
    background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    outline: none;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
    padding: calc(var(--openui-space-xs, 6px) - 1px) calc(var(--openui-space-m, 12px) - 1px);
    border-radius: var(--openui-radius-m, 8px);
    &[data-placeholder] {
      color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    }
    &:hover {
      background: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &[data-state="open"] {
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      --_openui-editable-table-select-icon-rotation: 180deg;
    }
    &:disabled {
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
      border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      cursor: not-allowed;
      --_openui-editable-table-select-icon-rotation: 0deg;
    }
  `,
  icon: css`
    height: 16px;
    width: 16px;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: rotate(var(--_openui-editable-table-select-icon-rotation, 0deg));
  `,
  content: css`
    box-sizing: border-box;
    position: relative;
    z-index: 99999;
    max-height: 372px;
    min-width: var(--radix-select-trigger-width);
    overflow: hidden;
    border: none;
    border-radius: var(--openui-radius-2xl, 14px);
    background-color: color-mix(
      in oklch,
      var(--openui-foreground, oklch(0.994 0 89.876 / 1)),
      var(--openui-text-white, oklch(1 0 89.876 / 1)) 6%
    );
    box-shadow:
      0 0 0 1px
        color-mix(
          in oklch,
          var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1)) 6%,
          transparent
        ),
      0 4px 12px -2px oklch(0 0 0 / 0.05),
      0 16px 32px -8px oklch(0 0 0 / 0.08);
    padding: 0;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    transform-origin: top center;
    animation: _openui-editable-table-select-show 0.18s ease-out forwards;
    @keyframes _openui-editable-table-select-show {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  viewport: css`
    box-sizing: border-box;
    padding: var(--openui-space-2xs, 4px) 0;
    width: 100%;
    /* Radix injects a style sibling before this viewport. In react-ui it is only the last child. */
    border-bottom-left-radius: calc(var(--openui-radius-2xl, 14px) - var(--openui-space-2xs, 4px));
    border-bottom-right-radius: calc(var(--openui-radius-2xl, 14px) - var(--openui-space-2xs, 4px));
  `,
  item: css`
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    box-sizing: border-box;
    position: relative;
    display: flex;
    cursor: default;
    user-select: none;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 var(--openui-space-xl, 24px) 0 var(--openui-space-m-l, 16px);
    border-radius: 0;
    outline: none;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    &:hover {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &:focus {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &[data-highlighted] {
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &[data-state="checked"] {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
    }
    &[data-disabled] {
      pointer-events: none;
      opacity: 0.5;
    }
  `,
  checkWrapper: css`
    position: absolute;
    right: 8px;
    height: 14px;
    width: 14px;
  `,
  checkIcon: css`
    height: 16px;
    width: 16px;
  `,
};
