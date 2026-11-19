export const goalRules = [
  String.raw`
  .openui-dashboard-goal-track {
    transition: transform 150ms;
  }
  .openui-dashboard-goal-track[data-hover] {
    transform: scaleY(1.5);
  }
  .openui-dashboard-goal {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  /* Stacked goals: well apart (20px between goals, over the card's own gap), so each reads as its own group;
   in a card taller than its goals (a row of taller cards), they spread to fill it. */
  .openui-dashboard-goal + .openui-dashboard-goal {
    margin-top: var(--openui-dashboard-space-lg);
  }
  .openui-dashboard-card-body:has(> .openui-dashboard-goal + .openui-dashboard-goal) {
    justify-content: space-between;
  }
  .openui-dashboard-goal-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
  }
  .openui-dashboard-goal-top strong {
    font-weight: 600;
  }
  /* The Kpi tile's progress bar: a 9% ink track and a textured fill, coloured
   by state. Past the target, the overrun follows the tick in a second texture. */
  .openui-dashboard-goal-track {
    position: relative;
    display: flex;
    gap: 2px;
    height: 6px; /* the kit's minimum bar thickness */
    border-radius: 999px;
    background: color-mix(in srgb, var(--openui-dashboard-ink) 9%, transparent);
  }
  .openui-dashboard-goal-fill {
    --openui-dashboard-goal-color: var(--openui-dashboard-series-1);
    flex: none;
    height: 100%;
    border-radius: 999px;
    background-color: var(--openui-dashboard-goal-color);
  }
  .openui-dashboard-goal-fill[data-state="ahead"] {
    --openui-dashboard-goal-color: var(--openui-dashboard-good-mark);
  }
  .openui-dashboard-goal-fill[data-state="behind"] {
    --openui-dashboard-goal-color: var(--openui-dashboard-warning-mark);
  }
  .openui-dashboard-goal-fill[data-state="over"] {
    --openui-dashboard-goal-color: var(--openui-dashboard-bad-mark);
  }
  /* The overrun past the tick: the same state colour pushed toward the ink, so it reads stronger than
   the bar in both themes (darker on a light card, lighter on a dark one). */
  .openui-dashboard-goal-fill.openui-dashboard-goal-beyond {
    background-color: color-mix(
      in srgb,
      var(--openui-dashboard-goal-color) 70%,
      var(--openui-dashboard-ink)
    );
  }
  .openui-dashboard-goal-track[data-passed] .openui-dashboard-goal-fill:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .openui-dashboard-goal-beyond {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .openui-dashboard-goal-mark {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    margin-left: -1px;
    border-radius: 2px;
    background: var(--openui-dashboard-ink);
  }
  .openui-dashboard-goal-state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--openui-dashboard-ink-secondary);
  }
  .openui-dashboard-goal-state .openui-dashboard-status-icon {
    font-size: 16px;
  }
  .openui-dashboard-goal-pace {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    border-radius: 2px;
    background: var(--openui-dashboard-ink);
  }
  /* Last period at this point: the pace tick's shape in the previous period's grey, so the two never read alike. */
  .openui-dashboard-goal-prev {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    margin-left: -1px;
    border-radius: 2px;
    background: var(--openui-dashboard-ink-muted);
    opacity: 0.7;
  }
  .openui-dashboard-goal-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
  }
`,
] as const;
