import { css } from "../../../styles/css";

export const names = { root: "openui-hint" } as const;

export const hintStyles = {
  root: css`
    box-sizing: border-box;
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    display: flex;
    align-items: center;
    gap: var(--openui-space-xs, 6px);
    &[data-invalid="true"] {
      color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
    }
  `,
};
