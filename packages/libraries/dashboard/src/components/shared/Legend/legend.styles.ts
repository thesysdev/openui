// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const legendRules = [
  // [0] legend shape marks
  String.raw`
  .openui-dashboard-legend-shape {
    flex: none;
    display: block;
  }`,
  // [1] legend, its overflow menu and swatches
  String.raw`
  .openui-dashboard-legend {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 16px;
    min-width: 0;
    padding: var(--openui-dashboard-space-xs) 0;
    font-size: 12px;
    color: var(--openui-dashboard-ink-secondary);
    white-space: nowrap;
  }
  .openui-dashboard-legend-overflow {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
  }
  .openui-dashboard-legend-more-anchor {
    position: relative;
    display: inline-flex;
    flex: none;
  }
  .openui-dashboard-legend-more {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    margin: -2px -6px;
    border: 0;
    border-radius: var(--openui-dashboard-radius-sm);
    background: transparent;
    font: inherit;
    color: var(--openui-dashboard-ink-secondary);
    cursor: pointer;
    transition:
      background 150ms,
      color 150ms;
  }
  .openui-dashboard-legend-more:hover,
  .openui-dashboard-legend-more[aria-expanded="true"] {
    color: var(--openui-dashboard-ink);
    background: var(--openui-dashboard-surface-subtle);
  }
  .openui-dashboard-legend-more:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }
  .openui-dashboard-legend-more .openui-dashboard-filter-caret {
    margin-left: 0;
    width: 5px;
    height: 5px;
  }
  .openui-dashboard-legend-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: -6px;
    z-index: 30;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 160px;
    padding: 10px 12px;
    border: 1px solid var(--openui-dashboard-border);
    border-radius: var(--openui-dashboard-radius-md);
    background: var(--openui-dashboard-surface);
    box-shadow: var(--openui-dashboard-shadow-pop);
  }
  .openui-dashboard-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .openui-dashboard-legend-swatch {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .openui-dashboard-legend-line {
    width: 14px;
    height: 0;
    border-top: 2px dashed var(--openui-dashboard-muted-mark);
  }
  .openui-dashboard-legend-dotted {
    border-top-style: dotted;
  }
  .openui-dashboard-legend-solid {
    border-top-style: solid;
  }`,
] as const;
