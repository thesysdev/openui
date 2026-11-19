// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const statusIconRules = [
  // [0] status icon and its tones
  String.raw`
  .openui-dashboard-status-icon {
    --openui-dashboard-status: var(--openui-dashboard-ink-muted);
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 0.85em;
    height: 0.85em;
    border-radius: 0.24em;
    background: color-mix(in srgb, var(--openui-dashboard-status) 16%, transparent);
    color: var(--openui-dashboard-status-ink, var(--openui-dashboard-ink-secondary));
  }
  .openui-dashboard-status-icon > span {
    width: 0.34em;
    height: 0.34em;
    border-radius: 50%;
    background: var(--openui-dashboard-status);
  }
  .openui-dashboard-status-shape {
    flex: none;
    display: inline-flex;
    align-items: center;

    justify-content: flex-start;
    width: 8px;
    height: 13px;
  }
  .openui-dashboard-status-shape > span {
    width: 6.5px;
    height: 6.5px;
    border-radius: 50%;
    background: var(
      --openui-dashboard-status-ink,
      var(--openui-dashboard-status, var(--openui-dashboard-ink-muted))
    );
  }
  .openui-dashboard-status-icon.openui-dashboard-status-warning > span,
  .openui-dashboard-status-shape.openui-dashboard-status-warning > span {
    width: 0.42em;
    height: 0.37em;
    border-radius: 0;
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
  .openui-dashboard-status-icon.openui-dashboard-status-bad > span,
  .openui-dashboard-status-shape.openui-dashboard-status-bad > span {
    width: 0.4em;
    height: 0.4em;
    border-radius: 0;
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  }
  .openui-dashboard-status-icon.openui-dashboard-status-info > span,
  .openui-dashboard-status-shape.openui-dashboard-status-info > span {
    width: 0.3em;
    height: 0.3em;
    border-radius: 0.06em;
  }
  .openui-dashboard-status-icon.openui-dashboard-status-neutral > span,
  .openui-dashboard-status-shape.openui-dashboard-status-neutral > span {
    width: 0.42em;
    height: 0.12em;
    border-radius: 0.06em;
  }
  .openui-dashboard-status-shape.openui-dashboard-status-warning > span {
    width: 8px;
    height: 7px;
  }
  .openui-dashboard-status-shape.openui-dashboard-status-bad > span {
    width: 7.6px;
    height: 7.6px;
  }
  .openui-dashboard-status-shape.openui-dashboard-status-info > span {
    width: 5.7px;
    height: 5.7px;
    border-radius: 1.1px;
  }
  .openui-dashboard-status-shape.openui-dashboard-status-neutral > span {
    width: 8px;
    height: 2.3px;
    border-radius: 1.1px;
  }
  .openui-dashboard-status-good {
    --openui-dashboard-status: var(--openui-dashboard-good-mark);
    --openui-dashboard-status-ink: var(--openui-dashboard-good);
  }
  .openui-dashboard-status-warning {
    --openui-dashboard-status: var(--openui-dashboard-warning-mark);
    --openui-dashboard-status-ink: var(--openui-dashboard-warning);
  }
  .openui-dashboard-status-bad {
    --openui-dashboard-status: var(--openui-dashboard-bad-mark);
    --openui-dashboard-status-ink: var(--openui-dashboard-bad);
  }
  .openui-dashboard-status-info {
    --openui-dashboard-status: var(--openui-dashboard-info);
    --openui-dashboard-status-ink: var(--openui-dashboard-info);
  }`,
] as const;
