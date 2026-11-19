// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const deltaBadgeRules = [
  // [0] delta badge and its tones
  String.raw`
  .openui-dashboard-delta {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-delta-good {
    color: var(--openui-dashboard-good);
  }
  .openui-dashboard-delta-bad {
    color: var(--openui-dashboard-bad);
  }
  .openui-dashboard-delta-neutral {
    color: var(--openui-dashboard-ink-secondary);
  }`,
] as const;
