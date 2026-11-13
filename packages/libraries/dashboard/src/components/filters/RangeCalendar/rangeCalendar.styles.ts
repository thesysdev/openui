export const rangeCalendarRules = [
  String.raw`
  .openui-dashboard-cal-head {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 0 6px 4px;
  }`,
  String.raw`
  .openui-dashboard-cal-title {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--openui-dashboard-ink);
  }`,
  String.raw`
  .openui-dashboard-cal-nav {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: var(--openui-dashboard-radius-sm);
    background: transparent;
    color: var(--openui-dashboard-ink-secondary);
    cursor: pointer;
    transition:
      background 150ms,
      color 150ms;
  }`,
  String.raw`
  .openui-dashboard-cal-nav:hover:not(:disabled) {
    background: var(--openui-dashboard-surface-subtle);
    color: var(--openui-dashboard-ink);
  }`,
  String.raw`
  .openui-dashboard-cal-nav:disabled {
    opacity: 0.3;
    cursor: default;
  }`,
  String.raw`
  .openui-dashboard-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    row-gap: 2px;
  }`,
  String.raw`
  .openui-dashboard-cal-weekday {
    padding-bottom: 4px;
    font-size: 12px;
    text-align: center;
    color: var(--openui-dashboard-ink-muted);
  }`,
  String.raw`
  /* The band between the two ends is painted on the cells so it runs
   unbroken; the ends paint half a cell so it starts and stops at their middle. */
  .openui-dashboard-cal-cell {
    --openui-dashboard-cal-band: color-mix(in srgb, var(--openui-dashboard-ink) 5%, transparent);
    display: grid;
  }`,
  String.raw`
  .openui-dashboard-cal-cell[data-inside] {
    background: var(--openui-dashboard-cal-band);
  }`,
  String.raw`
  /* The band rounds off where a week (or the month) starts and ends. */
  .openui-dashboard-cal-cell[data-inside][data-edge="left"] {
    border-radius: var(--openui-dashboard-radius-sm) 0 0 var(--openui-dashboard-radius-sm);
  }`,
  String.raw`
  .openui-dashboard-cal-cell[data-inside][data-edge="right"] {
    border-radius: 0 var(--openui-dashboard-radius-sm) var(--openui-dashboard-radius-sm) 0;
  }`,
  String.raw`
  .openui-dashboard-cal-cell[data-start] {
    background: linear-gradient(to right, transparent 50%, var(--openui-dashboard-cal-band) 50%);
  }`,
  String.raw`
  .openui-dashboard-cal-cell[data-end] {
    background: linear-gradient(to right, var(--openui-dashboard-cal-band) 50%, transparent 50%);
  }`,
  String.raw`
  .openui-dashboard-cal-day {
    position: relative;
    height: 30px;
    border: 0;
    border-radius: var(--openui-dashboard-radius-sm);
    background: transparent;
    font: inherit;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--openui-dashboard-ink);
    cursor: pointer;
    transition:
      background 150ms,
      color 150ms;
  }`,
  String.raw`
  /* :enabled for his :not(:disabled): goober breaks a selector with anything after a ")". */
  .openui-dashboard-cal-day:enabled:hover:not([aria-pressed="true"]) {
    background: var(--openui-dashboard-surface-subtle);
  }`,
  String.raw`
  .openui-dashboard-cal-day[aria-pressed="true"] {
    background: var(--openui-dashboard-ink);
    color: var(--openui-dashboard-surface);
  }`,
  String.raw`
  .openui-dashboard-cal-day:disabled {
    color: var(--openui-dashboard-ink-muted);
    opacity: 0.45;
    cursor: default;
  }`,
  String.raw`
  .openui-dashboard-cal-day[data-today]::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 4px;
    width: 3px;
    height: 3px;
    margin-left: -1.5px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.6;
  }`,
  String.raw`
  .openui-dashboard-cal-day:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: -1px;
  }`,
] as const;
