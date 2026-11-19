// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const statesRules = [
  // [0] empty and loading states
  String.raw`
  .openui-dashboard-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 200px;
    padding: 16px;
    border-radius: var(--openui-dashboard-radius-sm);
    background: color-mix(in srgb, var(--openui-dashboard-ink) 2.5%, transparent);
    text-align: center;
  }
  .openui-dashboard-empty[data-state="loading"] {
    align-items: stretch;
    padding: 0;
    background: none;
  }
  .openui-dashboard-empty[data-state="loading"] .openui-dashboard-skel-block {
    flex: 1 1 auto;
  }`,
] as const;
