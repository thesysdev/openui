// Rules Cohorts and Heatmap share: the grid, its hover and its cells. styles.ts joins them
// with Cohorts' own rules, in their original order.
export const relationshipsRules = [
  String.raw`  .openui-dashboard-grid-hover td {
    transition: transform 150ms;
  }
  .openui-dashboard-grid-hover td[data-hover] {
    position: relative;
    z-index: 1;
    transform: scale(1.18);
    box-shadow: 0 0 0 2px var(--openui-dashboard-surface);
  }
  /* His td:not(.cohort-label):not(.cohort-size), turned around (goober breaks a selector with
     anything after a ")"): every cell 2px, then the label and size cells back to radius-sm. */
  .openui-dashboard-cohort tr > td {
    border-radius: 2px;
  }
  .openui-dashboard-cohort tr > td.openui-dashboard-cohort-label,
  .openui-dashboard-cohort tr > td.openui-dashboard-cohort-size {
    border-radius: var(--openui-dashboard-radius-sm);
  }
`,
  String.raw`  .openui-dashboard-card-body > .openui-dashboard-grid-hover {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-grid-hover > .openui-dashboard-cohort-wrap {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-grid-hover > .openui-dashboard-cohort-wrap > .openui-dashboard-cohort {
    flex: 1 1 auto;
  }
  .openui-dashboard-grid-hover .openui-dashboard-cohort thead tr,
  .openui-dashboard-grid-hover .openui-dashboard-cohort tr.openui-dashboard-cohort-gap {
    height: 1px;
  }
  .openui-dashboard-cohort-wrap {
    overflow-x: auto;
  }
  .openui-dashboard-cohort {
    width: 100%;
    border-collapse: separate;
    border-spacing: 3px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-cohort th {
    padding: 0 6px 4px;
    font-weight: 500;
    color: var(--openui-dashboard-ink-muted);
    text-align: center;
    white-space: nowrap;
  }
  .openui-dashboard-cohort th:first-child,
  .openui-dashboard-cohort th:nth-child(2) {
    text-align: left;
  }
  .openui-dashboard-cohort td {
    height: 24px; /* Cohorts and Heatmap share one row height */
    min-width: 46px;
    padding: 0 6px;
    border-radius: var(--openui-dashboard-radius-sm);
    text-align: center;
    white-space: nowrap;
  }
  .openui-dashboard-cohort td.openui-dashboard-cohort-label {
    padding-left: 0;
    font-weight: 500;
    text-align: left;
  }
`,
  String.raw`  .openui-dashboard-cohort td.openui-dashboard-cohort-empty {
    /* Not reached yet: a barely-there fill (2% ink, half of W0's), so the grid stays whole while the triangle still reads. */
    background: color-mix(in srgb, var(--openui-dashboard-ink) 2%, transparent);
  }
  @supports not selector(::-webkit-scrollbar) {
    .openui-dashboard-cohort-wrap {
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--openui-dashboard-ink) 10%, transparent) transparent;
    }
  }
`,
] as const;
