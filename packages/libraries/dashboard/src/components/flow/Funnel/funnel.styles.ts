export const funnelRules = [
  String.raw`
  .openui-dashboard-funnel {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .openui-dashboard-funnel-step {
    display: grid;
    grid-template-columns: minmax(120px, 0.9fr) 3fr;
    align-items: center;
    gap: var(--openui-dashboard-space-md);
  }
  .openui-dashboard-funnel-steps {
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-funnel-in {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    padding: 0 8px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--openui-dashboard-ink-secondary);
  }
  .openui-dashboard-funnel-rates > .openui-dashboard-funnel-loss {
    margin-left: -42%;
    padding-left: 8px;
  }
  .openui-dashboard-funnel-label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }
  .openui-dashboard-funnel-label .openui-dashboard-funnel-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .openui-dashboard-funnel-label .openui-dashboard-funnel-count {
    white-space: nowrap;
  }
  .openui-dashboard-funnel-name {
    font-size: 13px;
    font-weight: 500;
  }
  .openui-dashboard-funnel-count {
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-funnel-bar {
    position: relative;
    height: 20px;
  }
  .openui-dashboard-funnel-bar::before {
    content: "";
    position: absolute;
    inset: 0 56px 0 0;
    border-radius: 0;
    background: var(--openui-dashboard-surface-subtle);
  }
  .openui-dashboard-funnel-fill {
    position: absolute;
    inset: 0 auto 0 0;
    display: flex;
    align-items: center;
    border-radius: 0;
    background-color: var(--openui-dashboard-series-1);
  }
  .openui-dashboard-funnel-prev {
    position: absolute;
    top: 3px;
    bottom: 3px;
    width: 0;
    border-left: 2px dashed var(--openui-dashboard-ink-secondary);
    opacity: 0.55;
  }
  .openui-dashboard-funnel-link {
    display: grid;
    grid-template-columns: minmax(120px, 0.9fr) 3fr;
    gap: var(--openui-dashboard-space-md);
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-funnel-gap {
    position: relative;
    min-height: 32px;
  }
  .openui-dashboard-card-body > .openui-dashboard-funnel.openui-dashboard-rows {
    flex: 1 1 auto;
  }
  .openui-dashboard-funnel > .openui-dashboard-scroll {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .openui-dashboard-funnel > .openui-dashboard-scroll > .openui-dashboard-scroll-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-funnel-steps {
    flex: 1 1 auto;
  }
  .openui-dashboard-funnel-steps > div:not(:first-child) {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  /* * + div for his div:not(:first-child): goober breaks a selector with anything after a ")". */
  .openui-dashboard-funnel-steps > * + div > .openui-dashboard-funnel-link {
    flex: 1 1 auto;
  }
  .openui-dashboard-funnel-gap svg {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: calc(100% - 56px);
    height: 100%;
    display: block;
  }
  .openui-dashboard-funnel-rate {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 100%;
    padding-left: 10px;
  }
  .openui-dashboard-funnel-lost {
    color: var(--openui-dashboard-bad);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-funnel-more {
    color: var(--openui-dashboard-ink-secondary);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-funnel-shape {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .openui-dashboard-funnel-heads,
  .openui-dashboard-funnel-rates {
    display: grid;
    grid-template-columns: repeat(var(--openui-dashboard-funnel-cols), minmax(0, 1fr));
  }
  .openui-dashboard-funnel-heads > div,
  .openui-dashboard-funnel-rates > div {
    min-width: 0;
    padding-right: 8px;
  }
  .openui-dashboard-funnel-heads .openui-dashboard-funnel-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .openui-dashboard-funnel-plot {
    position: relative;
  }
  .openui-dashboard-card-body > .openui-dashboard-funnel:has(> .openui-dashboard-funnel-shape) {
    flex: 1 1 auto;
  }
  .openui-dashboard-funnel > .openui-dashboard-funnel-shape {
    flex: 1 1 auto;
  }
  .openui-dashboard-funnel-grow {
    position: relative;
    flex: 1 1 0;
    min-height: 168px;
  }
  .openui-dashboard-funnel-grow > .openui-dashboard-funnel-plot {
    position: absolute;
    inset: 0 0 auto 0;
  }
  .openui-dashboard-funnel-hit {
    position: absolute;
    top: 0;
    bottom: 0;
  }
  .openui-dashboard-funnel-plot svg {
    display: block;
  }
  .openui-dashboard-funnel-rates > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-funnel-rates strong {
    font-weight: 600;
  }
  .openui-dashboard-funnel-flag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 7px;
    background: var(--openui-dashboard-ink);
    color: var(--openui-dashboard-surface);
    font-weight: 500;
    white-space: nowrap;
  }
  .openui-dashboard-funnel-flag-at {
    position: absolute;
    pointer-events: none;
    display: flex;
  }
  .openui-dashboard-funnel-flag > span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--openui-dashboard-bad-mark);
  }
  .openui-dashboard-funnel-split {
    position: absolute;
    inset: 0 auto 0 0;
    display: flex;
    gap: 2px;
    border-radius: 0;
    overflow: hidden;
  }
  .openui-dashboard-funnel-split > span {
    flex-basis: 0;
    min-width: 2px;
  }
`,
] as const;
