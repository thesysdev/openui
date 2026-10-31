import { css } from "../../../styles/css";

export const names = {
  empty: "openui-chart-empty",
  emptyText: "openui-chart-empty-text",
  yAxisLabel: "openui-chart-y-axis-label",
  xAxisLabel: "openui-chart-x-axis-label",
} as const;

const label = `
  font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
  letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
`;
export const chartBaseStyles = {
  empty: css`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  `,
  emptyText: css`
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  yAxisLabel: css`
    ${label} padding-bottom: var(--openui-space-s, 8px);
  `,
  xAxisLabel: css`
    ${label} text-align: center;
  `,
};
