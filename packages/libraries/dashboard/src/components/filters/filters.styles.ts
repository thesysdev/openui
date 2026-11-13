export const filtersRules = [
  String.raw`
  /* Popovers and the filter sheet are portalled to body, outside the dashboard root, so their
     wrapper (which carries this class) gets the root's base styles here. On the root itself
     these repeat what the layout styles already set. */
  color: var(--openui-dashboard-ink);
  font-feature-settings: "liga", "calt";
  -webkit-font-smoothing: antialiased;
  & *,
  & *::before,
  & *::after {
    box-sizing: border-box;
  }`,
  String.raw`
  .openui-dashboard-card-controls .openui-dashboard-filter-button {
    height: 28px;
    padding: 0 10px;
    border-radius: var(--openui-dashboard-radius-sm);
    font-size: 12px;
  }`,
  String.raw`
  /* Consecutive dropdowns cluster tightly; groups keep the wider bar gap. */
  .openui-dashboard-filter-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--openui-dashboard-space-xs);
  }`,
  String.raw`

  /* Keyboard focus: every interactive control announces itself. */
  .openui-dashboard-chip:focus-visible,
  .openui-dashboard-segmented button:focus-visible,
  .openui-dashboard-table th button:focus-visible,
  .openui-dashboard-multi-foot button:focus-visible,
  .openui-dashboard-button-primary:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }`,
  String.raw`
  /* Inside open menus the active row wears the hover tint, never a ring:
   it reads the same whether the pointer or the arrow keys put it there. */
  .openui-dashboard-menu-item:focus,
  .openui-dashboard-multi-option:focus-within {
    outline: none;
    background: var(--openui-dashboard-surface-subtle);
  }`,
  String.raw`

  .openui-dashboard-select-prefix {
    margin-right: 4px;
    color: var(--openui-dashboard-ink-muted);
  }`,
  String.raw`
  .openui-dashboard-filter-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--openui-dashboard-border-strong);
    border-radius: var(--openui-dashboard-radius-md);
    background: var(--openui-dashboard-surface);
    font: inherit;
    font-size: 13px;
    color: var(--openui-dashboard-ink);
    cursor: pointer;
    white-space: nowrap;
  }`,
  String.raw`
  .openui-dashboard-filter-button:hover {
    border-color: color-mix(in srgb, var(--openui-dashboard-ink) 18%, transparent);
  }`,
  String.raw`
  /* Active (a filter or comparison applied): one quiet step up from rest — the
   hover border plus a whisper of fill — never the full accent. */
  .openui-dashboard-filter-button[data-active="true"] {
    border-color: color-mix(in srgb, var(--openui-dashboard-ink) 18%, transparent);
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, var(--openui-dashboard-surface));
  }`,
  String.raw`
  .openui-dashboard-filter-button:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }`,
  String.raw`
  /* Locked while the dashboard is still streaming in. */
  .openui-dashboard-filter-button:disabled,
  .openui-dashboard-search input:disabled,
  .openui-dashboard-chip:disabled,
  .openui-dashboard-segmented button:disabled {
    opacity: 0.5;
    cursor: default;
  }`,
  String.raw`
  /* The standard scrollbar properties only where WebKit's pseudos are missing: setting them
     makes Chrome ignore the pseudos. */
  @supports not selector(::-webkit-scrollbar) {
    .openui-dashboard-menu {
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--openui-dashboard-ink) 10%, transparent) transparent;
    }
    .openui-dashboard-sheet {
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--openui-dashboard-ink) 10%, transparent) transparent;
    }
  }`,
  String.raw`
  .openui-dashboard-menu-item,
  .openui-dashboard-multi-foot button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 8px;
    border: 0;
    border-radius: var(--openui-dashboard-radius-sm);
    background: transparent;
    font: inherit;
    font-size: 13px;
    text-align: left;
    color: var(--openui-dashboard-ink);
    cursor: pointer;
    transition: border-color 150ms;
  }`,
  String.raw`
  .openui-dashboard-menu-item:hover,
  .openui-dashboard-multi-foot button:hover {
    background: var(--openui-dashboard-surface-subtle);
  }`,
  String.raw`
  .openui-dashboard-filter-button .openui-dashboard-select-prefix {
    margin-right: 0;
  }`,
] as const;
