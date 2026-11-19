// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const partsLegendRules = [
  // [0] parts legend
  String.raw`
  .openui-dashboard-parts-legend {
    columns: 240px;
    column-gap: 64px;
    column-rule: 1px dotted var(--openui-dashboard-border-strong);
    font-size: 13px;
  }
  .openui-dashboard-parts-legend > div {
    break-inside: avoid;
    padding-block: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }
  .openui-dashboard-parts-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--openui-dashboard-ink-secondary);
  }
  .openui-dashboard-parts-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .openui-dashboard-parts-nums {
    display: inline-flex;
    gap: 8px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-parts-share {
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-parts-value {
    font-weight: 600;
    min-width: 48px;
    text-align: right;
  }`,
] as const;
