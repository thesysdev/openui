// Raw fragments compile together in structure/styles.ts to preserve the cascade.
export const sectionRules = [
  String.raw`  .openui-dashboard-section {
    display: flex;
    flex-direction: column;
    gap: var(--openui-dashboard-space-sm);
  }

  .openui-dashboard-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 14px;
    border-radius: var(--openui-dashboard-radius-md);
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, transparent);
  }
  .openui-dashboard-section-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .openui-dashboard-section-description {
    margin: 0;
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
    text-align: right;
  }

`,
] as const;
