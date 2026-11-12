// Raw fragments compile together in structure/styles.ts to preserve the cascade.
export const rowRules = [
  String.raw`  .openui-dashboard-row {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--openui-dashboard-space-md);
  }
  .openui-dashboard-cell {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .openui-dashboard-cell > * {
    flex: 1 1 auto;
  }

  .openui-dashboard-cell > .openui-dashboard-card {
    min-height: var(--openui-dashboard-row-h, auto);
  }
  .openui-dashboard-w-quarter {
    grid-column: span 3;
  }
  .openui-dashboard-w-third {
    grid-column: span 4;
  }
  .openui-dashboard-w-half {
    grid-column: span 6;
  }
  .openui-dashboard-w-two-thirds {
    grid-column: span 8;
  }
  .openui-dashboard-w-three-quarters {
    grid-column: span 9;
  }
  .openui-dashboard-w-full {
    grid-column: span 12;
  }

`,
] as const;
