import { css } from "../../styles/css";

export const names = {
  root: "openui-card",
  variant: {
    clear: "openui-card--variant-clear",
    card: "openui-card--variant-card",
    sunk: "openui-card--variant-sunk",
  },
  width: { standard: "openui-card--width-standard", full: "openui-card--width-full" },
} as const;
export const cardStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xl, 24px);
    border: 1px solid transparent;
    box-sizing: border-box;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  variant: {
    card: css`
      box-shadow: none;
    `,
    clear: css`
      padding: 0px var(--openui-space-l, 18px);
      border-radius: var(--openui-radius-3xl, 16px);
      background-color: transparent;
      box-shadow: none;
    `,
    sunk: css`
      padding: var(--openui-space-l, 18px);
      border-radius: var(--openui-radius-3xl, 16px);
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      box-shadow: var(
        --openui-shadow-m,
        0 4px 6px -2px oklch(0 0 0 / 0.025),
        0 2px 2px -2px oklch(0 0 0 / 0.05)
      );
    `,
  },
  width: {
    standard: css`
      width: 80%;
    `,
    full: css`
      width: 100%;
    `,
  },
};
