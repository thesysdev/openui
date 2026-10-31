import { css } from "../../styles/css";

export const names = {
  root: "openui-label",
  requiredAsterisk: "openui-label-required-asterisk",
} as const;

export const labelStyles = {
  root: css`
    box-sizing: border-box;
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    &[aria-disabled="true"] {
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
      cursor: not-allowed;
    }
  `,
  requiredAsterisk: css`
    margin-left: var(--openui-space-3xs, 2px);
  `,
};
