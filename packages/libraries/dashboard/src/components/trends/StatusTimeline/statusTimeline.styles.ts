export const statusTimelineRules = [
  String.raw`  .openui-dashboard-st {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .openui-dashboard-st-row {
    display: grid;
    grid-template-columns: minmax(110px, 0.8fr) 3fr 64px;
    align-items: center;
    gap: 14px;
    font-size: 13px;
  }
  .openui-dashboard-st-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Square cells: each one is as tall as it is wide, with soft corners. */
  .openui-dashboard-st-cells {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 3px;
  }
  .openui-dashboard-st-cell {
    flex: 1 1 0;
    min-width: 8px;
    aspect-ratio: 1;
    border-radius: 3px;
    transition: opacity 150ms;
  }
  /* Strips that need more room than the card scroll sideways together; room above keeps the top row's tooltip clear. */
  .openui-dashboard-st-strips {
    display: grid;
    gap: 10px;
  }
  .openui-dashboard-st[data-scroll] {
    overflow-x: auto;
  }
  .openui-dashboard-st-value {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .openui-dashboard-st-axis {
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-st-ends {
    display: flex;
    justify-content: space-between;
  }
  .openui-dashboard-st-tip {
    position: absolute;
    bottom: calc(100% + 8px);
    z-index: 5;
    transform: translateX(-50%);
    pointer-events: none;
    white-space: nowrap;
  }

`,
] as const;
