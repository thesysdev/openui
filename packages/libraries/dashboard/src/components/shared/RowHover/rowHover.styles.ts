// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const rowHoverRules = [
  // [0] hoverable rows and the row tooltip
  String.raw`
  .openui-dashboard-rows {
    position: relative;
  }
  .openui-dashboard-hrow {
    margin-inline: -8px;
    padding-inline: 8px;
    border-radius: var(--openui-dashboard-radius-sm);
    transition: background 150ms;
  }
  .openui-dashboard-hrow[data-hover] {
    background: var(--openui-dashboard-surface-subtle);
  }
  .openui-dashboard-rowtip {
    position: absolute;
    z-index: 5;
    pointer-events: none;

    width: max-content;
    transform: translate(14px, -50%);
  }
  .openui-dashboard-rowtip[data-flip] {
    transform: translate(calc(-100% - 14px), -50%);
  }`,
] as const;
