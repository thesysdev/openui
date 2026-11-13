export const treemapRules = [
  String.raw`  .openui-dashboard-treemap-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 12px;
    font-size: 13px;
  }
  .openui-dashboard-treemap-key {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-treemap-glyph {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background:
      linear-gradient(var(--openui-dashboard-muted-mark), var(--openui-dashboard-muted-mark)) left
        top / 6px 6px no-repeat,
      color-mix(in srgb, var(--openui-dashboard-muted-mark) 30%, var(--openui-dashboard-surface));
  }
  .openui-dashboard-treemap-total {
    display: inline-flex;
    gap: 8px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-treemap-total span {
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-treemap-total strong {
    font-weight: 600;
    color: var(--openui-dashboard-ink);
  }
`,
  String.raw`  .openui-dashboard-treemap-cell {
    transition: opacity 150ms;
  }
`,
] as const;
