// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
// These classes belong to the groups named beside each fragment, not to one shared piece; each
// fragment can move to its group's styles once that group has its own folder.
export const baseRules = [
  // [0] chart header row (ViewSwitch and the chart groups)
  String.raw`
  .openui-dashboard-chart-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 26px;
    margin-bottom: 10px;
  }`,
  // [1] size key (Scatter, PointMap)
  String.raw`
  .openui-dashboard-size-key {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--openui-dashboard-ink-secondary);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-chart-top > .openui-dashboard-legend + .openui-dashboard-size-key {
    margin-left: auto;
  }
  /* The size key (Scatter, PointMap): the measure's name and three graduated dots, which match
     the plot's: fill fading with size, a subtle outline, and a tiny solid centre. */

  .openui-dashboard-size-name {
    color: var(--openui-dashboard-ink-muted);
  }

  .openui-dashboard-size-step {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .openui-dashboard-size-dot {
    flex: none;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--openui-dashboard-dot) 50%, transparent);
    background: radial-gradient(
      circle,
      var(--openui-dashboard-dot) 0 1.8px,
      color-mix(
          in srgb,
          var(--openui-dashboard-dot) var(--openui-dashboard-dot-fill, 20%),
          transparent
        )
        2px
    );
  }`,
  // [2] bar textures .tex-0 to .tex-5
  String.raw`
  .openui-dashboard-tex-0 {
    background-image:
      radial-gradient(
        circle at 2.12px 2.12px,
        rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0.8px,
        transparent 0.9px
      ),
      radial-gradient(
        circle at 6.36px 6.36px,
        rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0.8px,
        transparent 0.9px
      );
    background-size: 8.49px 8.49px;
  }
  .openui-dashboard-tex-1 {
    background-image: repeating-linear-gradient(
      135deg,
      rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0 0.45px,
      transparent 0.45px 4.5px
    );
  }
  .openui-dashboard-tex-2 {
    background-image: repeating-linear-gradient(
      45deg,
      rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0 0.45px,
      transparent 0.45px 4.5px
    );
  }
  .openui-dashboard-tex-3 {
    background-image: repeating-linear-gradient(
      0deg,
      rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0 0.45px,
      transparent 0.45px 4.5px
    );
  }
  .openui-dashboard-tex-4 {
    background-image:
      repeating-linear-gradient(
        135deg,
        rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0 0.45px,
        transparent 0.45px 5px
      ),
      repeating-linear-gradient(
        45deg,
        rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0 0.45px,
        transparent 0.45px 5px
      );
  }
  .openui-dashboard-tex-5 {
    background-image: repeating-linear-gradient(
      90deg,
      rgb(0 0 0 / var(--openui-dashboard-bar-ink)) 0 0.45px,
      transparent 0.45px 4.5px
    );
  }`,
  // [3] row baseline and chip (comparison intervals)
  String.raw`
  .openui-dashboard-row-baseline {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    transform: translateX(-1px);
    background-image: radial-gradient(
      circle at center,
      var(--openui-dashboard-ink-muted) 0.75px,
      transparent 0.9px
    );
    background-size: 2px 4px;
    background-repeat: repeat-y;
  }
  .openui-dashboard-row-chip {
    position: absolute;
    bottom: 0;
    transform: translateX(-50%);
    padding: 0 7px;
    background: var(--openui-dashboard-ink);
    color: var(--openui-dashboard-surface);
    font-weight: 500;
    white-space: nowrap;
  }`,
  // [4] tooltip dot (the chart groups)
  String.raw`
  .openui-dashboard-tip-dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }`,
  // [5] filter caret and checkbox (filters), chart, and a stat above a chart (cards)
  String.raw`
  .openui-dashboard-filter-caret {
    width: 6px;
    height: 6px;
    margin-left: 4px;
    border-right: 1.5px solid var(--openui-dashboard-ink-muted);
    border-bottom: 1.5px solid var(--openui-dashboard-ink-muted);
    transform: translateY(-2px) rotate(45deg);
  }
  .openui-dashboard-checkbox {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 14px;
    height: 14px;
    border: 1px solid var(--openui-dashboard-border-strong);
    border-radius: 4px;
    color: transparent;
    transition:
      background 150ms,
      border-color 150ms,
      color 150ms;
  }
  .openui-dashboard-chart {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    width: 100%;
    min-width: 0;
  }
  .openui-dashboard-chart-plot {
    flex: 1 1 auto;
    height: 0;
  }
  .openui-dashboard-chart .recharts-cartesian-axis-tick-value {
    fill: var(--openui-dashboard-ink-muted);
    font-size: 12px;
  }
  .openui-dashboard-chart .recharts-surface:focus,
  .openui-dashboard-chart .recharts-wrapper:focus,
  .openui-dashboard-chart *:focus {
    outline: none;
  }

  /* A card with a stat above its chart puts the legend on the stat's delta
   line, right-aligned: the chart wrapper dissolves so the legend can share
   the stat's row while the plot spans the row below. Narrow cards stack. */
  .openui-dashboard-card-body:has(> .openui-dashboard-stat + .openui-dashboard-chart),
  .openui-dashboard-state-content:has(> .openui-dashboard-stat + .openui-dashboard-chart) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--openui-dashboard-space-lg);
  }
  .openui-dashboard-card-body > .openui-dashboard-stat:has(+ .openui-dashboard-chart),
  .openui-dashboard-state-content > .openui-dashboard-stat:has(+ .openui-dashboard-chart) {
    grid-column: 1;
    grid-row: 1;
  }
  .openui-dashboard-card-body > .openui-dashboard-stat + .openui-dashboard-chart,
  .openui-dashboard-state-content > .openui-dashboard-stat + .openui-dashboard-chart {
    display: contents;
  }
  .openui-dashboard-card-body
    > .openui-dashboard-stat
    + .openui-dashboard-chart
    > .openui-dashboard-legend,
  .openui-dashboard-state-content
    > .openui-dashboard-stat
    + .openui-dashboard-chart
    > .openui-dashboard-legend {
    grid-column: 2;
    grid-row: 1;
    align-self: end;
    justify-content: flex-end;
    /* The subtitle's line box, so keys centre exactly on the delta line. */
    line-height: 1.4;
  }
  .openui-dashboard-card-body
    > .openui-dashboard-stat
    + .openui-dashboard-chart
    > .openui-dashboard-chart-plot,
  .openui-dashboard-state-content
    > .openui-dashboard-stat
    + .openui-dashboard-chart
    > .openui-dashboard-chart-plot {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  @container (max-width: 480px) {
    .openui-dashboard-card-body:has(> .openui-dashboard-stat + .openui-dashboard-chart),
    .openui-dashboard-state-content:has(> .openui-dashboard-stat + .openui-dashboard-chart) {
      display: flex;
    }
    .openui-dashboard-card-body > .openui-dashboard-stat + .openui-dashboard-chart,
    .openui-dashboard-state-content > .openui-dashboard-stat + .openui-dashboard-chart {
      display: flex;
    }
    .openui-dashboard-card-body
      > .openui-dashboard-stat
      + .openui-dashboard-chart
      > .openui-dashboard-legend,
    .openui-dashboard-state-content
      > .openui-dashboard-stat
      + .openui-dashboard-chart
      > .openui-dashboard-legend {
      justify-content: flex-start;
    }
  }`,
] as const;
