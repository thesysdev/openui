// Raw fragments compile together in structure/styles.ts to preserve the cascade.
export const dashboardRules = [
  String.raw`  .openui-dashboard-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--openui-dashboard-space-xl);
    max-width: 1440px;
    margin: 0 auto;
    padding: var(--openui-dashboard-space-xl) var(--openui-dashboard-space-2xl) 48px;
  }

`,
  String.raw`  /* Live data failed somewhere: one quiet line above the sections. */
  .openui-dashboard-dashboard-notice {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--openui-dashboard-radius-sm);
    background: color-mix(in srgb, var(--openui-dashboard-ink) 2.5%, transparent);
    box-shadow: inset 2px 0 0 var(--openui-dashboard-bad-mark);
  }

  /* The whole dashboard couldn't be drawn. */
  .openui-dashboard-dashboard-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 360px;
    padding: 24px;
    border-radius: var(--openui-dashboard-radius-md);
    background: var(--openui-dashboard-surface);
    box-shadow: inset 0 0 0 1px var(--openui-dashboard-border);
    text-align: center;
  }
  .openui-dashboard-dashboard-error .openui-dashboard-state-icon {
    color: var(--openui-dashboard-warning-mark);
  }

`,
] as const;
