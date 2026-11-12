export const popoverRules = [
  String.raw`

  .openui-dashboard-popover-anchor {
    position: relative;
    display: inline-flex;
  }`,
  String.raw`
  .openui-dashboard-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 30;
    padding: 8px;
    border: 1px solid var(--openui-dashboard-border);
    border-radius: var(--openui-dashboard-radius);
    background: var(--openui-dashboard-surface);
    box-shadow: var(--openui-dashboard-shadow-pop);
  }`,
] as const;
