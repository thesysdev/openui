export const metricsRules = [
  String.raw`
  .openui-dashboard-kpis .openui-dashboard-kpi-main {
    min-height: var(--openui-dashboard-kpi-main-min, auto);
  }`,
  String.raw`
  .openui-dashboard-kpi-compact
    .openui-dashboard-state[data-state="loading"]
    .openui-dashboard-skel-line {
    width: 64%;
    height: 18px;
  }`,
  String.raw`
  .openui-dashboard-kpi-compact
    .openui-dashboard-state[data-state="loading"]
    .openui-dashboard-skel-block {
    display: none;
  }`,
  String.raw`
  .openui-dashboard-kpi-compact .openui-dashboard-state[data-compact] .openui-dashboard-state-icon {
    width: 20px;
    height: 20px;
  }`,
  String.raw`
  .openui-dashboard-kpi-compact
    .openui-dashboard-state[data-compact]
    .openui-dashboard-state-icon
    svg {
    width: 12px;
    height: 12px;
  }`,
  String.raw`
  .openui-dashboard-kpi-compact
    .openui-dashboard-state[data-compact]
    .openui-dashboard-state-title {
    font-size: 12px;
    white-space: nowrap;
  }`,
  String.raw`
  .openui-dashboard-state[data-compact][data-state="loading"] .openui-dashboard-skel-line {
    width: 56%;
    height: 26px;
  }`,
  String.raw`
  .openui-dashboard-state[data-compact][data-state="loading"] .openui-dashboard-skel-block {
    flex: 0 0 12px;
    width: 40%;
    min-height: 12px;
  }`,
  String.raw`
  .openui-dashboard-state[data-compact] .openui-dashboard-state-layer {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 0;
    text-align: left;
  }`,
  String.raw`
  .openui-dashboard-state[data-compact][data-state="loading"] .openui-dashboard-state-layer {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 8px;
  }`,
  String.raw`
  .openui-dashboard-state[data-compact] .openui-dashboard-state-icon {
    width: 24px;
    height: 24px;
  }`,
  String.raw`
  .openui-dashboard-state[data-compact] .openui-dashboard-state-icon svg {
    width: 14px;
    height: 14px;
  }`,
  String.raw`
  .openui-dashboard-state[data-compact] .openui-dashboard-state-title {
    color: var(--openui-dashboard-ink-secondary);
  }
`,
] as const;
