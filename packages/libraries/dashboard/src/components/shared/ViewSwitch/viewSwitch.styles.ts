// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const viewSwitchRules = [
  // [0] segmented control and its small size (ViewSwitch; filters reuse it)
  String.raw`
  .openui-dashboard-segmented {
    display: inline-flex;
    padding: 3px;
    border-radius: var(--openui-dashboard-radius-md);
    background: var(--openui-dashboard-neutral-soft);
  }
  .openui-dashboard-segmented button {
    height: 24px;
    padding: 0 10px;
    border: 0;
    border-radius: var(--openui-dashboard-radius-sm);
    background: transparent;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: var(--openui-dashboard-ink-secondary);
    cursor: pointer;
    transition:
      background 150ms,
      color 150ms,
      box-shadow 150ms;
  }
  .openui-dashboard-segmented-sm {
    padding: 2px;
    border-radius: var(--openui-dashboard-radius-sm);
  }
  .openui-dashboard-segmented-sm button {
    height: 24px;
    padding: 0 9px;
    font-size: 12px;
    border-radius: calc(var(--openui-dashboard-radius-sm) - 2px);
  }`,
  // [1] view switch and its label in the chart header
  String.raw`
  .openui-dashboard-chart-top > .openui-dashboard-segmented {
    margin-left: auto;
  }
  .openui-dashboard-view-switch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .openui-dashboard-view-label {
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
    white-space: nowrap;
  }
  .openui-dashboard-chart-top > .openui-dashboard-view-switch {
    margin-left: auto;
  }`,
  // [2] segmented hover, checked and disabled
  String.raw`
  .openui-dashboard-segmented button:hover {
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-segmented button[aria-checked="true"] {
    background: var(--openui-dashboard-surface);
    color: var(--openui-dashboard-ink);
    box-shadow: 0 0 0 1px var(--openui-dashboard-border-strong);
  }
  .openui-dashboard-segmented button:disabled {
    opacity: 0.5;
    cursor: default;
  }`,
  // [3] segmented focus ring
  String.raw`
  .openui-dashboard-segmented button:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }`,
] as const;
