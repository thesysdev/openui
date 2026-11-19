export const searchFilterRules = [
  String.raw`
  .openui-dashboard-search {
    position: relative;
    display: inline-flex;
    align-items: center;
  }`,
  String.raw`
  /* Search rests as a 30px icon button (the field, shrunk around its icon) and
   opens to full width while focused or holding a query. */
  .openui-dashboard-search input {
    height: 30px;
    width: 30px;
    padding: 0 0 0 28px;
    border: 1px solid var(--openui-dashboard-border-strong);
    border-radius: var(--openui-dashboard-radius-md);
    background: var(--openui-dashboard-surface);
    font: inherit;
    font-size: 13px;
    color: var(--openui-dashboard-ink);
    color-scheme: inherit;
    cursor: pointer;
    transition:
      width 240ms cubic-bezier(0.32, 0.72, 0, 1),
      border-color 150ms,
      background 150ms;
  }`,
  String.raw`
  .openui-dashboard-search input::placeholder {
    color: transparent;
  }`,
  String.raw`
  .openui-dashboard-search:focus-within input,
  .openui-dashboard-search[data-open] input {
    width: 200px;
    padding-right: 30px;
    cursor: text;
  }`,
  String.raw`
  .openui-dashboard-search:focus-within input::placeholder {
    color: var(--openui-dashboard-ink-muted);
  }`,
  String.raw`
  /* Typing in search, or a query applied, is the filters' quiet active state
   (hover border plus a whisper of fill), not an accent focus ring. */
  .openui-dashboard-search input:hover,
  .openui-dashboard-search input:focus,
  .openui-dashboard-search input:not(:placeholder-shown) {
    outline: none;
    border-color: color-mix(in srgb, var(--openui-dashboard-ink) 18%, transparent);
  }`,
  String.raw`
  .openui-dashboard-search input:focus,
  .openui-dashboard-search input:not(:placeholder-shown) {
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, var(--openui-dashboard-surface));
  }`,
  String.raw`
  .openui-dashboard-search input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }`,
  String.raw`
  .openui-dashboard-search-clear {
    position: absolute;
    right: 6px;
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border: 0;
    border-radius: var(--openui-dashboard-radius-sm);
    background: transparent;
    color: var(--openui-dashboard-ink-muted);
    cursor: pointer;
    transition:
      background 150ms,
      color 150ms;
  }`,
  String.raw`
  .openui-dashboard-search-clear:hover {
    background: var(--openui-dashboard-surface-subtle);
    color: var(--openui-dashboard-ink);
  }`,
  String.raw`
  .openui-dashboard-search-clear:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 0;
  }`,
  String.raw`
  .openui-dashboard-search-icon {
    position: absolute;
    left: 9px;
    pointer-events: none;
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--openui-dashboard-ink-muted);
    border-radius: 50%;
  }`,
  String.raw`
  .openui-dashboard-search-icon::after {
    content: "";
    position: absolute;
    right: -4px;
    bottom: -3px;
    width: 5px;
    height: 1.5px;
    background: var(--openui-dashboard-ink-muted);
    transform: rotate(45deg);
  }`,
] as const;
