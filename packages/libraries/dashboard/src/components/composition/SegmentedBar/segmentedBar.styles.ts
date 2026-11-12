export const segmentedBarRules = [
  String.raw`  .openui-dashboard-segbar {
    display: flex;
    gap: 2px;
  }
  .openui-dashboard-segbar-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .openui-dashboard-card-body > .openui-dashboard-segbar-card {
    flex: 1 1 auto;
  }
  .openui-dashboard-segbar-stage {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .openui-dashboard-seg {
    display: flex;
    flex-direction: column;
    min-width: 2px;
  }
  .openui-dashboard-seg-bar {
    height: 8px;
  }
  .openui-dashboard-seg:first-child .openui-dashboard-seg-bar {
    border-radius: 4px 0 0 4px;
  }
  .openui-dashboard-seg:last-child .openui-dashboard-seg-bar {
    border-radius: 0 4px 4px 0;
  }
  .openui-dashboard-seg-band {
    display: block;
    width: 100%;
    height: 28px;
    -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
    mask-image: linear-gradient(to bottom, #000, transparent);
  }
`,
  String.raw`  .openui-dashboard-seg {
    transition: opacity 150ms;
  }
  .openui-dashboard-fade-parts[data-active] .openui-dashboard-seg:not([data-hover]) {
    opacity: 0.35;
  }
`,
] as const;
