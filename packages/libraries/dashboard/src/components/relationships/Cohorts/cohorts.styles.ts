// Rules only Cohorts uses: the All row, the gap row and the size column.
export const cohortsRules = [
  String.raw`  .openui-dashboard-cohort-all .openui-dashboard-cohort-label,
  .openui-dashboard-cohort-all .openui-dashboard-cohort-size {
    font-weight: 600;
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-cohort tr.openui-dashboard-cohort-gap > td {
    height: 8px;
    padding: 0;
  }
`,
  String.raw`  .openui-dashboard-cohort td.openui-dashboard-cohort-size {
    text-align: left;
    color: var(--openui-dashboard-ink-muted);
  }
`,
] as const;
