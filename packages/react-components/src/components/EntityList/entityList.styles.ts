import { css } from "../../styles/css";

export const names = {
  root: "openui-entity-list",
  row: "openui-entity-list-row",
  cellLeft: "openui-entity-list-cell-left",
  cellRight: "openui-entity-list-cell-right",
  size: { default: "openui-entity-list--size-default", small: "openui-entity-list--size-small" },
  rowType: {
    header: "openui-entity-list-row--row-type-header",
    body: "openui-entity-list-row--row-type-body",
    footer: "openui-entity-list-row--row-type-footer",
  },
  rightVariant: {
    text: "openui-entity-list-cell-right--right-variant-text",
    number: "openui-entity-list-cell-right--right-variant-number",
  },
} as const;
export const entityListStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  `,
  row: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--openui-space-m, 12px);
    padding: var(--openui-space-m, 12px) 0;
    border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    &:last-child {
      border-bottom: none;
    }
  `,
  cellLeft: css`
    flex: 1;
    min-width: 0;
    max-width: 50%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    font: var(--_openui-entity-list-cell-left-font);
    letter-spacing: var(--_openui-entity-list-cell-left-letter-spacing);
    font-variation-settings: var(--_openui-entity-list-cell-left-font-variation-settings);
    color: var(--_openui-entity-list-cell-color, inherit);
  `,
  cellRight: css`
    flex: 1;
    min-width: 0;
    max-width: 50%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    text-align: right;
    color: var(--_openui-entity-list-cell-color, inherit);
    font: var(--_openui-entity-list-right-font);
    letter-spacing: var(--_openui-entity-list-right-letter-spacing);
    font-variation-settings: var(--_openui-entity-list-right-font-variation-settings);
  `,
  size: {
    default: css`
      --_openui-entity-list-cell-left-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-cell-left-letter-spacing: var(
        --openui-text-body-default-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-cell-left-font-variation-settings: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-entity-list-right-text-font: var(
        --openui-text-body-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-right-text-letter-spacing: var(
        --openui-text-body-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-right-text-font-variation-settings: var(
        --openui-font-variation-medium,
        "wght" 560
      );
      --_openui-entity-list-right-number-font: var(
        --openui-text-numbers-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-right-number-letter-spacing: var(
        --openui-text-numbers-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-right-number-font-variation-settings: var(
        --openui-font-variation-medium,
        "wght" 560
      );
    `,
    small: css`
      --_openui-entity-list-cell-left-font: var(
        --openui-text-body-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-cell-left-letter-spacing: var(
        --openui-text-body-sm-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-cell-left-font-variation-settings: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-entity-list-right-text-font: var(
        --openui-text-body-sm-heavy,
        560 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-right-text-letter-spacing: var(
        --openui-text-body-sm-heavy-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-right-text-font-variation-settings: var(
        --openui-font-variation-medium,
        "wght" 560
      );
      --_openui-entity-list-right-number-font: var(
        --openui-text-numbers-sm-heavy,
        560 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-right-number-letter-spacing: var(
        --openui-text-numbers-sm-heavy-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-right-number-font-variation-settings: var(
        --openui-font-variation-medium,
        "wght" 560
      );
    `,
  },
  rowType: {
    header: css`
      --_openui-entity-list-cell-color: var(
        --openui-text-neutral-secondary,
        oklch(0.097 0 0 / 0.6)
      );
    `,
    body: "",
    footer: css`
      --_openui-entity-list-right-text-font: var(
        --openui-text-body-lg-heavy,
        560 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-right-text-letter-spacing: var(
        --openui-text-body-lg-heavy-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-right-text-font-variation-settings: var(
        --openui-font-variation-medium,
        "wght" 560
      );
      --_openui-entity-list-right-number-font: var(
        --openui-text-numbers-lg-heavy,
        560 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-entity-list-right-number-letter-spacing: var(
        --openui-text-numbers-lg-heavy-letter-spacing,
        -0.01em
      );
      --_openui-entity-list-right-number-font-variation-settings: var(
        --openui-font-variation-medium,
        "wght" 560
      );
    `,
  },
  rightVariant: {
    text: css`
      --_openui-entity-list-right-font: var(--_openui-entity-list-right-text-font);
      --_openui-entity-list-right-letter-spacing: var(
        --_openui-entity-list-right-text-letter-spacing
      );
      --_openui-entity-list-right-font-variation-settings: var(
        --_openui-entity-list-right-text-font-variation-settings
      );
    `,
    number: css`
      --_openui-entity-list-right-font: var(--_openui-entity-list-right-number-font);
      --_openui-entity-list-right-letter-spacing: var(
        --_openui-entity-list-right-number-letter-spacing
      );
      --_openui-entity-list-right-font-variation-settings: var(
        --_openui-entity-list-right-number-font-variation-settings
      );
    `,
  },
};
