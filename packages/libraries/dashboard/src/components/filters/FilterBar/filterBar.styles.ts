export const filterBarRules = [
  String.raw`
  .openui-dashboard-filterbar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px var(--openui-dashboard-space-md);
    margin: -8px -12px 0;
    padding: 8px 12px;
    border-radius: var(--openui-dashboard-radius);
    background: color-mix(in srgb, var(--openui-dashboard-page) 86%, transparent);
    backdrop-filter: saturate(1.4) blur(8px);
  }`,
  String.raw`
  .openui-dashboard-filterbar-spacer {
    flex: 1;
  }`,
  String.raw`
  /* A small dot between sections of the bar: when · each chip set · dropdowns. */
  .openui-dashboard-filterbar-dot {
    flex: none;
    width: 3px;
    height: 3px;
    margin: 0 -6px;
    border-radius: 50%;
    background: var(--openui-dashboard-ink-muted);
    opacity: 0.5;
  }`,
  String.raw`
  /* Wide: the Filters button hides and the items row dissolves into the bar. */
  .openui-dashboard-filterbar-menu {
    display: none;
  }`,
  String.raw`
  .openui-dashboard-filterbar-items {
    display: contents;
  }`,
  String.raw`

  /* The bottom tray the Filters button opens. It portals to the body, so it
   layers over everything and pins to the real viewport. */
  .openui-dashboard-sheet-scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(0, 0, 0, 0.4);
  }`,
  String.raw`
  .openui-dashboard-sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 61;
    max-width: 420px;
    margin: 0 auto;
    max-height: 72vh;
    overflow-y: auto;
    padding: 6px var(--openui-dashboard-space-lg) var(--openui-dashboard-space-xl);
    border: 1px solid var(--openui-dashboard-border);
    border-bottom: 0;
    border-radius: var(--openui-dashboard-radius) var(--openui-dashboard-radius) 0 0;
    background: var(--openui-dashboard-surface);
    color: var(--openui-dashboard-ink);
    box-shadow: var(--openui-dashboard-shadow-pop);
    animation: openui-dashboard-sheet-in 360ms cubic-bezier(0.32, 0.72, 0, 1);
  }`,
  String.raw`
  @keyframes openui-dashboard-sheet-in {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }`,
  String.raw`
  .openui-dashboard-sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 6px;
    font-size: 14px;
    font-weight: 600;
  }`,
  String.raw`
  .openui-dashboard-sheet-head button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--openui-dashboard-border);
    border-radius: var(--openui-dashboard-radius-sm);
    background: var(--openui-dashboard-surface);
    color: var(--openui-dashboard-ink-secondary);
    cursor: pointer;
  }`,
  String.raw`
  .openui-dashboard-sheet-head button svg {
    width: 11px;
    height: 11px;
  }`,
  String.raw`
  .openui-dashboard-sheet-body {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }`,
  String.raw`
  .openui-dashboard-sheet-body > * {
    padding: 14px 0;
  }`,
  String.raw`
  .openui-dashboard-sheet-body > * + * {
    border-top: 1px solid var(--openui-dashboard-border);
  }`,
  String.raw`
  .openui-dashboard-sheet .openui-dashboard-search input {
    width: 100%;
    padding-right: 30px;
    cursor: text;
  }`,
  String.raw`
  .openui-dashboard-sheet .openui-dashboard-search input::placeholder {
    color: var(--openui-dashboard-ink-muted);
  }`,
  String.raw`
  .openui-dashboard-sheet .openui-dashboard-search {
    display: flex;
  }`,
  String.raw`
  @container openui-dashboard (max-width: 560px) {
    .openui-dashboard-filterbar-menu {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 30px;
      padding: 0 12px;
      border: 1px solid var(--openui-dashboard-border-strong);
      border-radius: var(--openui-dashboard-radius-md);
      background: var(--openui-dashboard-surface);
      font: inherit;
      font-size: 13px;
      color: var(--openui-dashboard-ink);
      cursor: pointer;
    }
    .openui-dashboard-filterbar-menu svg {
      width: 14px;
      height: 14px;
      color: var(--openui-dashboard-ink-muted);
    }
    .openui-dashboard-filterbar-items {
      display: none;
    }
  }`,
] as const;
