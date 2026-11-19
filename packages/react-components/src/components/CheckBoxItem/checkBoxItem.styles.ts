import { css } from "../../styles/css";

const body = `
  font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

export const names = {
  root: "openui-check-box-item",
  container: "openui-check-box-item-container",
  indicator: "openui-check-box-item-indicator",
  content: "openui-check-box-item-content",
  label: "openui-check-box-item-label",
  description: "openui-check-box-item-description",
  icon: "openui-check-box-item-icon",
  check: "openui-check-box-item-check",
} as const;

export const checkBoxItemStyles = {
  root: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: var(--openui-radius-xs, 4px);
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    cursor: pointer;
    margin-top: var(--openui-space-2xs, 4px);
    background-color: transparent;

    --_openui-check-box-item-bg: transparent;
    --_openui-check-box-item-hover-bg: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    --_openui-check-box-item-hover-color: var(
      --openui-text-neutral-secondary,
      oklch(0.097 0 0 / 0.6)
    );
    &:hover {
      background-color: var(--_openui-check-box-item-hover-bg);
      color: var(--_openui-check-box-item-hover-color);
    }
    &[data-state="checked"] {
      --_openui-check-box-item-bg: var(
        --openui-interactive-accent-default,
        oklch(0.546 0.215 262.881 / 1)
      );
      --_openui-check-box-item-hover-bg: var(--_openui-check-box-item-bg);
      --_openui-check-box-item-hover-color: var(
        --openui-text-neutral-primary,
        oklch(0.097 0 0 / 1)
      );
      background-color: var(--_openui-check-box-item-bg);
      color: var(--_openui-check-box-item-hover-color);
    }
    &:disabled {
      background-color: var(--_openui-check-box-item-bg);
      cursor: not-allowed;
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    }
  `,
  container: css`
    display: flex;
    align-items: flex-start;
    gap: var(--openui-space-s, 8px);
    padding: var(--openui-space-3xs, 2px) var(--openui-space-000, 0px);
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    cursor: pointer;
    &:disabled {
      cursor: not-allowed;
    }
  `,
  indicator: css`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--openui-text-accent-primary, oklch(0.994 0 89.876 / 1));
  `,
  content: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
  label: css`
    ${body}
    flex: 1;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    cursor: pointer;
    overflow-wrap: anywhere;
    &:disabled {
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
      cursor: not-allowed;
    }
  `,
  description: css`
    ${body}
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    overflow-wrap: anywhere;
  `,
};
