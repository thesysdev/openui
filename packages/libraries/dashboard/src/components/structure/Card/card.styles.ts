// Raw fragments compile together in structure/styles.ts to preserve the cascade.
export const cardRules = [
  String.raw`  .openui-dashboard-card {
    display: flex;
    flex-direction: column;
    gap: var(--openui-dashboard-space-sm);
    min-width: 0;
    padding: var(--openui-dashboard-space-lg) var(--openui-dashboard-space-xl);
    border: 1px solid var(--openui-dashboard-border);
    border-radius: var(--openui-dashboard-radius);
    background: var(--openui-dashboard-surface);
    box-shadow: var(--openui-dashboard-shadow);
  }
  .openui-dashboard-card-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 12px;
  }

  .openui-dashboard-card {
    position: relative;
    container-type: inline-size;
  }
  /* Hidden until it holds a control (no filters, no chart switch), so the header keeps no
     empty gap for it. */
  .openui-dashboard-card-controls {
    display: none;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }
  .openui-dashboard-card-slot {
    display: contents;
  }

  /* His :not(:has(button, select, input)), turned around: goober breaks a selector with a comma
     inside parentheses, or with anything after a ")", so each :has() ends its own selector. */
  .openui-dashboard-card-controls:has(button),
  .openui-dashboard-card-controls:has(select),
  .openui-dashboard-card-controls:has(input) {
    display: flex;
  }
  @container (max-width: 520px) {
    .openui-dashboard-card-head {
      flex-direction: column;
    }
    .openui-dashboard-card-controls {
      margin-left: 0;
    }
  }
  .openui-dashboard-card-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.35;
  }
  .openui-dashboard-card-subtitle {
    margin: 2px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-card-body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--openui-dashboard-space-sm);
    min-width: 0;
  }

`,
] as const;
