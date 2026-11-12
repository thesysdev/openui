import { css } from "../../styles/css";

const body = `
  font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

export const names = {
  root: "openui-radio-item",
  svg: "openui-radio-item-svg",
  content: "openui-radio-item-content",
  label: "openui-radio-item-label",
  description: "openui-radio-item-description",
  container: "openui-radio-item-container",
  path: "openui-radio-item-path",
  border: "openui-radio-item-border",
  inner: "openui-radio-item-inner",
} as const;

// Goober merges repeated :disabled blocks at their first occurrence, before :hover. Reset
// hover's input as well so a disabled unchecked radio keeps its foreground fill.
export const radioItemStyles = {
  root: css`
    box-sizing: border-box;
    flex-shrink: 0;
    border-radius: var(--openui-radius-full, 9999px);
    border: none;
    height: 16px;
    width: 16px;
    cursor: pointer;
    background-color: transparent;
    margin-top: var(--openui-space-2xs, 4px);
    &[data-state] {
      position: relative;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    --_openui-radio-item-inner: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    --_openui-radio-item-hover-inner: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    &:hover {
      --_openui-radio-item-inner: var(--_openui-radio-item-hover-inner);
    }
    &[data-state="checked"] {
      --_openui-radio-item-fill: var(
        --openui-interactive-accent-default,
        oklch(0.546 0.215 262.881 / 1)
      );
      --_openui-radio-item-stroke: var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
      --_openui-radio-item-inner: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      --_openui-radio-item-hover-inner: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    }
    &:disabled {
      --_openui-radio-item-inner: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      --_openui-radio-item-hover-inner: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    }
  `,
  svg: css`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
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
  path: css`
    fill: var(--_openui-radio-item-fill, var(--openui-foreground, oklch(0.994 0 89.876 / 1)));
  `,
  border: css`
    stroke: var(
      --_openui-radio-item-stroke,
      var(--openui-border-interactive, oklch(0.097 0 0 / 0.12))
    );
  `,
  inner: css`
    fill: var(--_openui-radio-item-inner);
  `,
};
