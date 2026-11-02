import { css } from "../../styles/css";

export const names = {
  root: "openui-pie-chart-skeleton",
  container: "openui-pie-chart-skeleton-container",
  shape: "openui-pie-chart-skeleton-shape",
  legend: "openui-pie-chart-skeleton-legend",
  legendItem: "openui-pie-chart-skeleton-legend-item",
  legendDot: "openui-pie-chart-skeleton-legend-dot",
  variant: {
    pie: "openui-pie-chart-skeleton--variant-pie",
    donut: "openui-pie-chart-skeleton--variant-donut",
  },
  appearance: {
    circular: "openui-pie-chart-skeleton--appearance-circular",
    semiCircular: "openui-pie-chart-skeleton--appearance-semi-circular",
  },
} as const;

const elevated = "var(--openui-elevated-strong, oklch(0.097 0 0 / 0.16))";

export const pieChartSkeletonStyles = {
  root: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--openui-space-m, 12px);
    padding: var(--openui-space-m, 12px);
  `,
  variant: {
    pie: css`
      --_openui-pie-chart-skeleton-shape-background: ${elevated};
      --_openui-pie-chart-skeleton-shape-border: none;
    `,
    donut: css`
      --_openui-pie-chart-skeleton-shape-background: transparent;
      --_openui-pie-chart-skeleton-shape-border: var(--openui-space-xl, 24px) solid ${elevated};
    `,
  },
  appearance: {
    circular: css`
      --_openui-pie-chart-skeleton-shape-radius: 50%;
      --_openui-pie-chart-skeleton-shape-border-bottom: var(
        --_openui-pie-chart-skeleton-shape-border
      );
    `,
    semiCircular: css`
      --_openui-pie-chart-skeleton-shape-radius: var(--openui-radius-full, 9999px)
        var(--openui-radius-full, 9999px) 0 0;
      --_openui-pie-chart-skeleton-shape-border-bottom: 0;
    `,
  },
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  shape: css`
    border-radius: var(--_openui-pie-chart-skeleton-shape-radius);
    background-color: var(--_openui-pie-chart-skeleton-shape-background);
    border: var(--_openui-pie-chart-skeleton-shape-border);
    border-bottom: var(--_openui-pie-chart-skeleton-shape-border-bottom);
    width: var(--_openui-pie-chart-skeleton-shape-width);
    height: var(--_openui-pie-chart-skeleton-shape-height);
  `,
  legend: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-s, 8px);
    min-width: 120px;
  `,
  legendItem: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s, 8px);
  `,
  legendDot: css`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${elevated};
    flex-shrink: 0;
  `,
};
