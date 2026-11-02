import { css } from "../../styles/css";

export const names = {
  root: "openui-radio-group",
  variant: {
    clear: "openui-radio-group--variant-clear",
    card: "openui-radio-group--variant-card",
    sunk: "openui-radio-group--variant-sunk",
  },
} as const;

export const radioGroupStyles = {
  root: css`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xs, 6px);
    border: 1px solid;
    border-radius: var(--openui-radius-xl, 12px);
  `,
  variant: {
    clear: css`
      border-color: transparent;
      background-color: transparent;
      padding: var(--openui-space-000, 0px);
    `,
    card: css`
      border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      padding: var(--openui-space-m, 12px);
    `,
    sunk: css`
      border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      padding: var(--openui-space-m, 12px);
    `,
  },
};
