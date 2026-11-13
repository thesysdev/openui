export const rangePanelRules = [
  String.raw`
  /* Date range: presets | a one-month calendar with a readout and Apply. */
  .openui-dashboard-range {
    display: grid;
    grid-template-columns: 148px minmax(0, 1fr);
  }`,
  String.raw`
  .openui-dashboard-range-presets {
    padding-right: 8px;
    border-right: 1px solid var(--openui-dashboard-border);
  }`,
  String.raw`
  .openui-dashboard-range-custom {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 2px 4px 2px 12px;
  }`,
  String.raw`
  .openui-dashboard-range-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--openui-dashboard-border);
  }`,
  String.raw`
  .openui-dashboard-range-readout {
    font-size: 12px;
    color: var(--openui-dashboard-ink-secondary);
    font-variant-numeric: tabular-nums;
  }`,
  String.raw`
  /* The one filled button: ink, like every other selected state — never the accent. */
  .openui-dashboard-button-primary {
    flex: none;
    height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--openui-dashboard-radius-sm);
    background: var(--openui-dashboard-ink);
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    color: var(--openui-dashboard-surface);
    cursor: pointer;
    transition: opacity 150ms;
  }`,
  String.raw`
  .openui-dashboard-button-primary:disabled {
    opacity: 0.4;
    cursor: default;
  }`,
  String.raw`
  @media (max-width: 520px) {
    .openui-dashboard-range {
      grid-template-columns: 1fr;
    }
    .openui-dashboard-range-presets {
      padding: 0 0 8px;
      border-right: 0;
      border-bottom: 1px solid var(--openui-dashboard-border);
    }
    .openui-dashboard-range .openui-dashboard-range-custom {
      padding: 10px 0 0;
    }
  }
`,
] as const;
