export const kpiRules = [
  String.raw`
  .openui-dashboard-kpi-hint {
    margin-top: -4px;
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
  }`,
  String.raw`
  .openui-dashboard-kpi-text {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }`,
  String.raw`
  .openui-dashboard-kpi-value.openui-dashboard-kpi-text {
    font-size: 22px;
    font-weight: 500;
  }`,
  String.raw`
  .openui-dashboard-kpi-text-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    padding-block: 0.12em;
    margin-block: -0.12em;
  }`,
  String.raw`
  .openui-dashboard-kpi-status-dots > span[data-state="warning"] {
    width: 9px;
    height: 8px;
    border-radius: 0;
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }`,
  String.raw`
  .openui-dashboard-kpi-status-dots > span[data-state="bad"] {
    width: 8px;
    height: 8px;
    border-radius: 0;
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  }`,
  String.raw`
  .openui-dashboard-kpi {
    gap: 10px;
  }`,
  String.raw`
  .openui-dashboard-kpi-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--openui-dashboard-ink-secondary);
  }`,
  String.raw`
  .openui-dashboard-kpi-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }`,
  String.raw`
  .openui-dashboard-kpi-value {
    font-size: 26px;
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: -0.025em;
    font-variant-numeric: tabular-nums;
  }`,
  String.raw`
  .openui-dashboard-kpi-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
  }`,
  String.raw`
  .openui-dashboard-kpi-visual {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }`,
  String.raw`
  .openui-dashboard-kpi-caption {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
    font-variant-numeric: tabular-nums;
  }`,
  String.raw`
  .openui-dashboard-kpi-meter-track {
    height: 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--openui-dashboard-ink) 9%, transparent);
    overflow: hidden;
  }`,
  String.raw`
  .openui-dashboard-kpi-meter-fill {
    height: 100%;
    border-radius: inherit;
    background-color: var(--openui-dashboard-series-1);
  }`,
  String.raw`
  .openui-dashboard-kpi-split-bar {
    display: flex;
    gap: 2px;
    height: 8px;
  }`,
  String.raw`
  .openui-dashboard-kpi-split-bar > span {
    flex-basis: 0;
    min-width: 2px;
    border-radius: 2px;
  }`,
  String.raw`
  .openui-dashboard-kpi-split-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    font-size: 12px;
    color: var(--openui-dashboard-ink-secondary);
    font-variant-numeric: tabular-nums;
  }`,
  String.raw`
  .openui-dashboard-kpi-split-legend > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }`,
  String.raw`
  .openui-dashboard-kpi-split-legend i {
    width: 7px;
    height: 7px;
    border-radius: 2px;
  }`,
  String.raw`
  .openui-dashboard-kpi-status {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }`,
  String.raw`
  .openui-dashboard-kpi-status-dots {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
  }`,
  String.raw`
  .openui-dashboard-kpi-status-dots > span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--openui-dashboard-neutral-soft);
  }`,
  String.raw`
  .openui-dashboard-kpi-status-dots > span[data-state="good"] {
    background-color: var(--openui-dashboard-good-mark);
  }`,
  String.raw`
  .openui-dashboard-kpi-status-dots > span[data-state="warning"] {
    background-color: var(--openui-dashboard-warning-mark);
  }`,
  String.raw`
  .openui-dashboard-kpi-status-dots > span[data-state="bad"] {
    background-color: var(--openui-dashboard-bad-mark);
  }`,
  String.raw`
  .openui-dashboard-kpi-spark {
    width: 120px;
    max-width: 100%;
    height: 44px;
    flex: none;
  }`,
  String.raw`
  .openui-dashboard-kpi-spark-wrap {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    justify-content: flex-end;
    container-type: inline-size;
  }`,
  String.raw`
  @container (max-width: 47px) {
    .openui-dashboard-kpi-spark-wrap > .openui-dashboard-kpi-spark {
      display: none;
    }
  }`,
] as const;
