// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const rankedListRules = [
  // [0] rank panel and map side panel
  String.raw`
  .openui-dashboard-rank-panel {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-geo-side {
    display: flex;
    flex-direction: column;
  }`,
  // [1] map side panel head
  String.raw`
  .openui-dashboard-geo-side {
    position: relative;
    flex: 1 1 220px;
    min-width: 0;

    margin-top: -32px;
    border-left: 1px solid var(--openui-dashboard-border);
    padding-left: var(--openui-dashboard-space-lg);
  }
  .openui-dashboard-geo-side-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 10px;
  }`,
  // [2] ranked list rows, and their narrow-container layout
  String.raw`
  @container openui-dashboard (max-width: 720px) {
    .openui-dashboard-geo-side {
      border-left: 0;
      padding-left: 0;
      margin-top: 0;
    }
  }
  .openui-dashboard-rank-head {
    display: flex;
    justify-content: flex-end;
    padding-bottom: 10px;
  }
  .openui-dashboard-rank {
    display: flex;
    flex-direction: column;
    gap: 22px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .openui-dashboard-rank-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .openui-dashboard-rank-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
  }
  .openui-dashboard-rank-name {
    min-width: 0;
    font-weight: 500;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .openui-dashboard-rank-value {
    flex-shrink: 0;
    white-space: nowrap;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-rank-track {
    height: 4px;
    border-radius: 999px;

    background: color-mix(in srgb, var(--openui-dashboard-ink) 9%, transparent);
    overflow: hidden;
  }
  .openui-dashboard-rank-fill {
    height: 100%;
    border-radius: 999px;
    background-color: var(--openui-dashboard-series-1);
  }
  .openui-dashboard-rank-track {
    transition: transform 150ms;
  }
  .openui-dashboard-rank-row:hover .openui-dashboard-rank-track,
  .openui-dashboard-rank-row[data-linked] .openui-dashboard-rank-track {
    transform: scaleY(1.5);
  }`,
] as const;
