// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const sortToggleRules = [
  // [0] sort toggle
  String.raw`
  .openui-dashboard-sort-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--openui-dashboard-border);
    border-radius: var(--openui-dashboard-radius-sm);
    background: var(--openui-dashboard-surface);
    color: var(--openui-dashboard-ink);
    cursor: pointer;
    transition: border-color 150ms;
  }
  .openui-dashboard-sort-toggle:hover {
    border-color: color-mix(in srgb, var(--openui-dashboard-ink) 18%, transparent);
  }
  .openui-dashboard-sort-toggle svg {
    width: 14px;
    height: 14px;
    transition: transform 150ms;
  }
  .openui-dashboard-sort-toggle[data-asc] svg {
    transform: scaleY(-1);
  }
  .openui-dashboard-sort-toggle:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }`,
] as const;
