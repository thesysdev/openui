// Raw fragments compile together in structure/styles.ts to preserve the cascade.
export const baseRules = [
  String.raw`
  color: var(--openui-dashboard-ink);
  background: var(--openui-dashboard-page);
  font-family: inherit;
  font-feature-settings: "liga", "calt";
  -webkit-font-smoothing: antialiased;
  & *,
  & *::before,
  & *::after {
    box-sizing: border-box;
  }
  /* Scrollbars: thin, quiet, no track. */
  & ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  & ::-webkit-scrollbar-track {
    background: transparent;
  }
  & ::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: color-mix(in srgb, var(--openui-dashboard-ink) 10%, transparent);
  }
  & ::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--openui-dashboard-ink) 18%, transparent);
  }

`,
  String.raw`  @container openui-dashboard (width > 1100px) {
    .openui-dashboard-cell[data-wide-span] {
      grid-column: span var(--openui-dashboard-wide-span);
    }
  }

  @container openui-dashboard (max-width: 1100px) {
    .openui-dashboard-w-quarter {
      grid-column: span 6;
    }
    .openui-dashboard-w-third {
      grid-column: span 6;
    }
    .openui-dashboard-w-two-thirds,
    .openui-dashboard-w-three-quarters,
    .openui-dashboard-md-full {
      grid-column: span 12;
    }
  }
  @container openui-dashboard (max-width: 720px) {
    .openui-dashboard-w-third,
    .openui-dashboard-w-half,
    .openui-dashboard-md-full {
      grid-column: span 12;
    }
    .openui-dashboard-w-quarter.openui-dashboard-cell {
      grid-column: span 6;
    }
    .openui-dashboard-w-quarter.openui-dashboard-sm-full {
      grid-column: span 12;
    }
    .openui-dashboard-dashboard {
      padding: 20px 16px 40px;
    }

    .openui-dashboard-cell > .openui-dashboard-card {
      min-height: clamp(280px, 75cqw, var(--openui-dashboard-row-h, 400px));
    }
  }
  @container openui-dashboard (max-width: 480px) {
    .openui-dashboard-w-quarter.openui-dashboard-cell {
      grid-column: span 12;
    }

    .openui-dashboard-section-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
    .openui-dashboard-section-description {
      text-align: left;
    }
  }
  container: openui-dashboard / inline-size;

`,
  String.raw`  .openui-dashboard-state {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: inherit;
    min-width: 0;
  }
  .openui-dashboard-state-content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: inherit;
    min-width: 0;
    visibility: hidden;
  }
  .openui-dashboard-state-layer {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    text-align: center;
  }
  /* Cards: empty and error sit in a quiet well that marks the content area. */
  /* His .state:not([data-compact]):not([data-state="loading"]) .state-layer, as the states that
     draw a layer listed one by one (goober breaks a selector with anything after a ")"), then
     compact tiles taken back out. */
  .openui-dashboard-state[data-state="empty"] > .openui-dashboard-state-layer,
  .openui-dashboard-state[data-state="no-results"] > .openui-dashboard-state-layer,
  .openui-dashboard-state[data-state="error"] > .openui-dashboard-state-layer,
  .openui-dashboard-state[data-state="invalid"] > .openui-dashboard-state-layer {
    border-radius: var(--openui-dashboard-radius-sm);
    background: color-mix(in srgb, var(--openui-dashboard-ink) 2.5%, transparent);
  }
  .openui-dashboard-state[data-compact] > .openui-dashboard-state-layer {
    border-radius: 0;
    background: none;
  }
  /* Icon tile: a small raised square on the well; error tints only the glyph. */
  .openui-dashboard-state-icon {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: var(--openui-dashboard-radius-sm);
    background: var(--openui-dashboard-surface);
    box-shadow:
      inset 0 0 0 1px var(--openui-dashboard-border),
      0 1px 2px color-mix(in srgb, var(--openui-dashboard-ink) 5%, transparent);
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-state-icon svg {
    width: 16px;
    height: 16px;
  }
  .openui-dashboard-state[data-state="error"] .openui-dashboard-state-icon,
  .openui-dashboard-empty[data-state="error"] .openui-dashboard-state-icon {
    color: var(--openui-dashboard-bad-mark);
  }
  .openui-dashboard-state-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .openui-dashboard-state-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-state-hint {
    max-width: 34ch;
    font-size: 12px;
    line-height: 1.45;
    color: var(--openui-dashboard-ink-muted);
    text-wrap: balance;
  }
  /* Loading: a quiet skeleton filling the content area — a short line, then a
   block — with a slow shimmer that stops for reduced motion. */
  .openui-dashboard-state[data-state="loading"] .openui-dashboard-state-layer {
    align-items: stretch;
    justify-content: flex-start;
    gap: 12px;
    padding: 0;
  }
  .openui-dashboard-skel {
    display: block;
    border-radius: var(--openui-dashboard-radius-sm);
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--openui-dashboard-ink) 4%, transparent) 0%,
      color-mix(in srgb, var(--openui-dashboard-ink) 7%, transparent) 40%,
      color-mix(in srgb, var(--openui-dashboard-ink) 4%, transparent) 80%
    );
    background-size: 220% 100%;
    animation: openui-dashboard-shimmer 1.6s ease-in-out infinite;
  }
  .openui-dashboard-skel-line {
    width: 38%;
    height: 12px;
  }
  .openui-dashboard-skel-block {
    flex: 1 1 auto;
    min-height: 24px;
  }
  @keyframes openui-dashboard-shimmer {
    from {
      background-position: 110% 0;
    }
    to {
      background-position: -110% 0;
    }
  }
  /* The skeleton's reduced-motion rule sits with the sheen's and the spinner's below: goober merges
     @media blocks with the same query into the first one, so they share one block placed
     after every base rule it overrides. */
  /* A card whose content hasn't arrived (or was all invalid) still holds a card's height. */
  .openui-dashboard-state:has(> .openui-dashboard-state-content:empty) {
    min-height: 200px;
  }
  .openui-dashboard-state[data-state="no-results"] .openui-dashboard-state-text,
  .openui-dashboard-empty[data-state="no-results"] .openui-dashboard-state-text {
    gap: 4px;
  }
  /* Invalid: the glyph takes the warning colour; the tile stays neutral. */
  .openui-dashboard-state[data-state="invalid"] .openui-dashboard-state-icon {
    color: var(--openui-dashboard-warning-mark);
  }

  /* Refreshing: live data is being fetched again. The numbers stay; a slow
   shimmer sweeps over the whole card and a small round loader sits inside
   its top-right corner. */
  /* The shimmer anchors to the card: refreshing, or being written (the card draws it). */
  .openui-dashboard-card:has(.openui-dashboard-sheen),
  .openui-dashboard-kpi-compact:has(> .openui-dashboard-sheen) {
    position: relative;
  }
  .openui-dashboard-sheen {
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(
      100deg,
      transparent 35%,
      color-mix(
          in srgb,
          var(--openui-dashboard-ink) var(--openui-dashboard-sheen-peak, 2.5%),
          transparent
        )
        50%,
      transparent 65%
    );
    background-size: 250% 100%;
    animation: openui-dashboard-shimmer 1.6s ease-in-out infinite;
  }
  /* Dark needs a little more of the ink for the sweep to show at all. */

  .openui-dashboard-refresh {
    position: absolute;
    /* Inside the card's top-right corner, clear of the curve. */
    top: 8px;
    right: 8px;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--openui-dashboard-surface);
    color: var(--openui-dashboard-ink-muted);
    animation: openui-dashboard-fade-in 150ms ease-out;
  }
  .openui-dashboard-refresh svg {
    width: 14px;
    height: 14px;
    animation: openui-dashboard-spin 0.9s linear infinite;
  }
  @keyframes openui-dashboard-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes openui-dashboard-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .openui-dashboard-skel {
      animation: none;
    }
    .openui-dashboard-refresh svg {
      animation-duration: 2.4s;
    }
    .openui-dashboard-sheen {
      animation: none;
      background: color-mix(in srgb, var(--openui-dashboard-ink) 2%, transparent);
    }
  }

  /* Part of a component couldn't be drawn: the rest shows, with one muted line saying what's missing. */
  /* A compact yellow banner: soft warning tint, amber icon, text mixed toward
   the ink so 12px stays readable on the tint in both themes. */
  .openui-dashboard-part-note {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    margin: 8px 0 0;
    padding: 4px 8px;
    border-radius: var(--openui-dashboard-radius-sm);
    background: var(--openui-dashboard-warning-soft);
    font-size: 12px;
    line-height: 16px;
    color: color-mix(in srgb, var(--openui-dashboard-warning) 55%, var(--openui-dashboard-ink));
  }
  .openui-dashboard-part-note svg {
    flex: none;
    width: 12px;
    height: 12px;
    color: var(--openui-dashboard-warning);
  }

`,
  String.raw`  /* Loading: the skeleton holds still; the card's one shimmer does the moving. */
  /* Tones as shares of the ink: the line (or tile value bar) one step above the
   big block, so it reads as the heading placeholder. Dark needs a little more to show. */

  .openui-dashboard-state[data-state="loading"] .openui-dashboard-skel {
    animation: none;
    background: color-mix(
      in srgb,
      var(--openui-dashboard-ink) var(--openui-dashboard-skel-line-tone),
      transparent
    );
  }
  .openui-dashboard-state[data-state="loading"] .openui-dashboard-skel-block {
    background: color-mix(
      in srgb,
      var(--openui-dashboard-ink) var(--openui-dashboard-skel-block-tone),
      transparent
    );
  }
  /* While streaming its height isn't known either: hold a card's height until the content lands.
   Forced over finished content it keeps that content's exact size instead. */
  .openui-dashboard-state[data-streamed]:not([data-compact]) {
    min-height: 200px;
  }
  /* Compact Kpi items (past six tiles): the state fits the value row alone. */

  .openui-dashboard-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
`,
] as const;
