export const keyValuesRules = [
  String.raw`
  .openui-dashboard-kv {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
  .openui-dashboard-kv-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid var(--openui-dashboard-grid);
    font-size: 13px;
  }
  .openui-dashboard-kv-row:last-child {
    border-bottom: 0;
  }
  .openui-dashboard-kv-row dt {
    color: var(--openui-dashboard-ink-secondary);
  }
  .openui-dashboard-kv-row dd {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    margin: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`,
] as const;
