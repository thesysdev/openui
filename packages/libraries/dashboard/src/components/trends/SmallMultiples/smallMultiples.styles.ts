export const smallMultiplesRules = [
  String.raw`  .openui-dashboard-sm {
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-sm-row {
    position: relative;
    display: grid;
    gap: 0 20px;
  }
  .openui-dashboard-sm-row + .openui-dashboard-sm-row {
    margin-top: 16px;
    padding-top: 16px;
  }
  .openui-dashboard-sm-row + .openui-dashboard-sm-row::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    border-top: 1px dotted var(--openui-dashboard-border-strong);
  }
  .openui-dashboard-sm-cell {
    position: relative;
    min-width: 0;
  }
  .openui-dashboard-sm-cell + .openui-dashboard-sm-cell::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: -10px;
    border-left: 1px dotted var(--openui-dashboard-border-strong);
  }
`,
] as const;
