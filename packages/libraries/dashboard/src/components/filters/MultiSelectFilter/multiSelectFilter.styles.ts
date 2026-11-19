export const multiSelectFilterRules = [
  String.raw`
  /* The footer's action (Select all) reads a step quieter than the options. */
  .openui-dashboard-multi-foot button {
    color: var(--openui-dashboard-ink-secondary);
  }`,
  String.raw`
  .openui-dashboard-multi-list {
    display: flex;
    flex-direction: column;
    max-height: 260px;
    overflow-y: auto;
  }`,
  String.raw`
  .openui-dashboard-multi-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border-radius: var(--openui-dashboard-radius-sm);
    font-size: 13px;
    color: var(--openui-dashboard-ink);
    cursor: pointer;
    transition: border-color 150ms;
  }`,
  String.raw`
  .openui-dashboard-multi-option:hover {
    background: var(--openui-dashboard-surface-subtle);
  }`,
  String.raw`
  /* Neutral checkbox: ticking every option must not turn the menu a colour. */
  .openui-dashboard-multi-option {
    position: relative;
  }`,
  String.raw`
  .openui-dashboard-multi-option input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    margin: 0;
    pointer-events: none;
  }`,
  String.raw`
  .openui-dashboard-multi-option input:checked + .openui-dashboard-checkbox {
    border-color: transparent;
    background: var(--openui-dashboard-ink);
    color: var(--openui-dashboard-surface);
  }`,
  String.raw`
  .openui-dashboard-multi-foot button:disabled {
    opacity: 0.4;
    cursor: default;
    background: transparent;
  }`,
  String.raw`
  .openui-dashboard-multi-option[data-locked] {
    cursor: default;
  }`,
  String.raw`
  .openui-dashboard-multi-foot {
    display: flex;
    justify-content: flex-start;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid var(--openui-dashboard-border);
  }`,
  String.raw`
  /* A multi-select narrowed to several values: a soft-square count. */
  .openui-dashboard-filter-count {
    display: inline-grid;
    place-items: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: calc(var(--openui-dashboard-radius-sm) - 2px);
    background: var(--openui-dashboard-surface);
    box-shadow: inset 0 0 0 1px var(--openui-dashboard-border-strong);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--openui-dashboard-ink);
  }`,
] as const;
