export const kpisRules = [
  String.raw`
  .openui-dashboard-kpis {
    border: 1px solid var(--openui-dashboard-border);
    border-radius: var(--openui-dashboard-radius);
    background: var(--openui-dashboard-surface);
    box-shadow: var(--openui-dashboard-shadow);
    overflow: hidden;
  }`,
  String.raw`
  .openui-dashboard-kpi-compact {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: var(--openui-dashboard-space-sm) var(--openui-dashboard-space-md);
  }`,
  String.raw`
  .openui-dashboard-kpi-compact-value {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 22px;
    line-height: 1.15;
    font-weight: 600;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }`,
  String.raw`
  .openui-dashboard-kpi-compact-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    font-size: 12px;
  }`,
  String.raw`
  .openui-dashboard-kpi-compact-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--openui-dashboard-ink-secondary);
  }`,
  String.raw`
  .openui-dashboard-kpi-compact-meta .openui-dashboard-delta {
    flex: none;
  }`,
  String.raw`
  .openui-dashboard-kpis-compact .openui-dashboard-kpi-cell + .openui-dashboard-kpi-cell::before {
    top: 12px;
    bottom: 12px;
  }`,
  String.raw`
  .openui-dashboard-kpis-row {
    position: relative;
    display: flex;
  }`,
  String.raw`
  .openui-dashboard-kpis-row + .openui-dashboard-kpis-row::before {
    content: "";
    position: absolute;
    top: 0;
    left: var(--openui-dashboard-space-md);
    right: var(--openui-dashboard-space-md);
    border-top: 1px dotted var(--openui-dashboard-border-strong);
  }`,
  String.raw`
  .openui-dashboard-kpi-cell {
    position: relative;
    display: flex;
    flex: 1 1 0;
    min-width: 0;
  }`,
  String.raw`
  .openui-dashboard-kpi-cell > * {
    flex: 1 1 auto;
  }`,
  String.raw`
  .openui-dashboard-kpi-cell .openui-dashboard-kpi {
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }`,
  String.raw`
  .openui-dashboard-kpi-cell + .openui-dashboard-kpi-cell::before {
    content: "";
    position: absolute;
    left: 0;
    top: 14px;
    bottom: 14px;
    border-left: 1px dotted var(--openui-dashboard-border-strong);
  }`,
  String.raw`
  /* His .kpis:has(.kpi-spark) .kpi-main, through a variable the strip sets: goober breaks a
     selector with anything after a ")". */
  .openui-dashboard-kpis:has(.openui-dashboard-kpi-spark) {
    --openui-dashboard-kpi-main-min: 44px;
  }`,
] as const;
