import { css } from "goober";
import { typography } from "../../shared/typography";

export const names = {
  root: "openui-dashboard-small-card",
  slotTop: "openui-dashboard-small-card-slot-top",
  slotBottom: "openui-dashboard-small-card-slot-bottom",
  title: "openui-dashboard-small-card-title",
  metricRow: "openui-dashboard-small-card-metric-row",
  metric: "openui-dashboard-small-card-metric",
  trend: "openui-dashboard-small-card-trend",
  direction: {
    up: "openui-dashboard-small-card-trend--direction-up",
    down: "openui-dashboard-small-card-trend--direction-down",
  },
  snippet: "openui-dashboard-small-card-snippet",
  lhs: "openui-dashboard-small-card-snippet-lhs",
  image: "openui-dashboard-small-card-snippet-image",
  lhsContent: "openui-dashboard-small-card-snippet-lhs-content",
  rhs: "openui-dashboard-small-card-snippet-rhs",
  rhsContent: "openui-dashboard-small-card-snippet-rhs-content",
  snippetText: "openui-dashboard-small-card-snippet-text",
} as const;

const snippetSecondary = `
  & .openui-text-block-secondary {
    ${typography("body", "small")}
  }
`;

export const styles = {
  root: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--openui-space-xl, 24px);
    min-width: 0;
  `,
  slotTop: css`
    display: flex;
    align-items: flex-start;
    min-width: 0;
  `,
  slotBottom: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-2xs, 4px);
    min-width: 0;
  `,
  title: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    ${typography("body", "default")}
  `,
  metricRow: css`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--openui-space-xs, 6px);
    min-width: 0;
  `,
  metric: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    ${typography("number", "heading-medium")}
  `,
  trend: css`
    color: var(
      --_openui-dashboard-small-card-trend-color,
      var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6))
    );
    ${typography("number", "small")}
  `,
  direction: {
    up: css`
      --_openui-dashboard-small-card-trend-color: var(
        --openui-text-success-primary,
        oklch(0.448 0.108 151.328 / 1)
      );
    `,
    down: css`
      --_openui-dashboard-small-card-trend-color: var(
        --openui-text-danger-primary,
        oklch(0.505 0.19 27.518 / 1)
      );
    `,
  },
  snippet: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-m, 12px);
    width: 100%;
    min-width: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
  `,
  lhs: css`
    display: flex;
    align-items: center;
    flex: 1;
    gap: var(--openui-space-m, 12px);
    min-width: 0;
  `,
  image: css`
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: var(--openui-radius-m, 8px);
    object-fit: cover;
  `,
  lhsContent: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  `,
  rhs: css`
    display: flex;
    flex-shrink: 1;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    margin-left: var(--openui-space-m, 12px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  rhsContent: css`
    display: flex;
    justify-content: flex-end;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  `,
  /* Overrides of react-components' TextBlockView: a wrapper class plus its stable classes. */
  snippetText: css`
    ${snippetSecondary}
  `,
  snippetMetricText: css`
    ${snippetSecondary}
    & .openui-text-block-primary {
      font: 700 14px/1.5 var(--openui-font-body, "Inter", sans-serif);
    }
  `,
};
