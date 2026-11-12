// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const scrollAreaRules = [
  // [0] scroll fill
  String.raw`
  .openui-dashboard-scroll-fill {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-scroll-fill > .openui-dashboard-scroll-body {
    flex: 1 1 0;
    min-height: 0;
  }`,
  // [1] scroll area, fades and steps; also the filter menus' scrollbars
  String.raw`
  .openui-dashboard-scroll {
    position: relative;
    min-width: 0;
  }
  .openui-dashboard-scroll-body {
    overflow-y: auto;
    scrollbar-width: none;
    overscroll-behavior: contain;
  }
  .openui-dashboard-scroll-body::-webkit-scrollbar {
    display: none;
  }
  .openui-dashboard-scroll-body[data-overflow] {
    padding-bottom: 36px;
  }
  .openui-dashboard-scroll-fade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 44px;
    background: linear-gradient(to bottom, transparent, var(--openui-dashboard-surface));
    pointer-events: none;
  }
  .openui-dashboard-scroll-step {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    display: inline-flex;
    padding: 1px;
    border: 1px solid var(--openui-dashboard-border-strong);
    border-radius: var(--openui-dashboard-radius-sm);
    background: var(--openui-dashboard-surface);
    box-shadow: var(--openui-dashboard-shadow);
  }
  .openui-dashboard-scroll-step button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: calc(var(--openui-dashboard-radius-sm) - 2px);
    background: transparent;
    color: var(--openui-dashboard-ink-secondary);
    cursor: pointer;
    transition:
      color 150ms,
      background 150ms;
  }
  .openui-dashboard-scroll-step button:hover:not(:disabled) {
    color: var(--openui-dashboard-ink);
    background: var(--openui-dashboard-surface-subtle);
  }
  .openui-dashboard-scroll-step button:disabled {
    color: var(--openui-dashboard-ink-muted);
    opacity: 0.4;
    cursor: default;
  }
  .openui-dashboard-scroll-step button:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }
  .openui-dashboard-scroll-step svg {
    width: 11px;
    height: 11px;
  }
  .openui-dashboard-scroll-body > .openui-dashboard-menu,
  .openui-dashboard-scroll-body > .openui-dashboard-multi-list {
    max-height: none;
    overflow: visible;
  }`,
] as const;
