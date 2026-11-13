export const chipFilterRules = [
  String.raw`

  .openui-dashboard-card-controls .openui-dashboard-chips {
    gap: 0;
    padding: 2px;
    border-radius: var(--openui-dashboard-radius-sm);
    background: var(--openui-dashboard-neutral-soft);
  }`,
  String.raw`
  .openui-dashboard-card-controls .openui-dashboard-chip {
    height: 24px;
    padding: 0 9px;
    border: 0;
    border-radius: calc(
      var(--openui-dashboard-radius-sm) - 2px
    ); /* concentric: 8 outside = 6 inside + 2 padding */
    background: transparent;
    font-size: 12px;
    color: var(--openui-dashboard-ink-secondary);
  }`,
  String.raw`
  .openui-dashboard-card-controls .openui-dashboard-chip:hover {
    color: var(--openui-dashboard-ink);
  }`,
  String.raw`
  .openui-dashboard-card-controls .openui-dashboard-chip[aria-checked="true"] {
    background: var(--openui-dashboard-surface);
    color: var(--openui-dashboard-ink);
    box-shadow: 0 0 0 1px var(--openui-dashboard-border-strong);
  }`,
  String.raw`
  .openui-dashboard-chips {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }`,
  String.raw`
  .openui-dashboard-chips > .openui-dashboard-select-prefix {
    margin-right: 2px;
    font-size: 13px;
  }`,
  String.raw`
  /* Chips are fully round pills (by choice) with the dropdowns' text; the
   selected chip is outlined in ink, never a solid fill. */
  .openui-dashboard-chip {
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--openui-dashboard-border-strong);
    border-radius: 999px;
    background: var(--openui-dashboard-surface);
    font: inherit;
    font-size: 13px;
    color: var(--openui-dashboard-ink-secondary);
    cursor: pointer;
    transition:
      border-color 150ms,
      color 150ms,
      background 150ms;
  }`,
  String.raw`
  .openui-dashboard-chip:hover {
    border-color: color-mix(in srgb, var(--openui-dashboard-ink) 18%, transparent);
    color: var(--openui-dashboard-ink);
  }`,
  String.raw`
  /* Selected: an ink stroke marks the choice; the fill is the segmented
   track's own grey, so the two controls share one neutral. */
  .openui-dashboard-chip[aria-checked="true"] {
    border-color: var(--openui-dashboard-ink);
    background: var(--openui-dashboard-neutral-soft);
    font-weight: 500;
    color: var(--openui-dashboard-ink);
  }`,
] as const;
