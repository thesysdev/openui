// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const tooltipCardRules = [
  // [0] tooltip card
  String.raw`
  .openui-dashboard-tooltip {
    min-width: 184px;
    padding: 12px 14px;
    border: 1px solid var(--openui-dashboard-border);
    border-radius: var(--openui-dashboard-radius-md);
    background: var(--openui-dashboard-surface);
    box-shadow: var(--openui-dashboard-shadow-pop);
    font-size: 12px;
  }
  .openui-dashboard-tooltip-title {
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--openui-dashboard-border);
    font-weight: 600;
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-tooltip-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 4px 0;
    color: var(--openui-dashboard-ink-secondary);
  }
  .openui-dashboard-tooltip-row span:first-child {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .openui-dashboard-tooltip-value {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    font-weight: 600;
    color: var(--openui-dashboard-ink);
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-tooltip-value > .openui-dashboard-delta {
    font-weight: 500;
  }
  .openui-dashboard-tooltip-share {
    color: var(--openui-dashboard-ink-muted);
    font-weight: 400;
  }
  .openui-dashboard-tooltip-sub {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--openui-dashboard-border);
    font-weight: 400;
    color: var(--openui-dashboard-ink-muted);
  }`,
] as const;
