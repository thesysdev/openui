export const optionListRules = [
  String.raw`

  .openui-dashboard-menu {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 280px;
    overflow-y: auto;
  }`,
  String.raw`
  .openui-dashboard-menu-item[aria-selected="true"] {
    font-weight: 500;
  }`,
  String.raw`
  .openui-dashboard-menu-check {
    flex: none;
    width: 12px;
    height: 12px;
    color: var(--openui-dashboard-ink-secondary);
  }`,
] as const;
