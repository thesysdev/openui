// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const rowMarksRules = [
  // [0] row grid and guide
  String.raw`
  .openui-dashboard-row-grid {
    position: absolute;
    top: -3px;
    bottom: -3px;
    border-left: 1px solid var(--openui-dashboard-grid);
  }
  .openui-dashboard-row-guide {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: var(--openui-dashboard-grid);
  }`,
  // [1] tooltip marks
  String.raw`
  .openui-dashboard-tip-mark {
    flex: none;
    width: 12px;
    height: 10px;
  }`,
] as const;
