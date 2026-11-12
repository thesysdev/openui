export const tableRules = [
  String.raw`
  .openui-dashboard-table-wrap {
    overflow-x: auto;
    margin: 0 calc(-1 * var(--openui-dashboard-space-xl));
    padding: 0 calc(var(--openui-dashboard-space-xl) - 12px);
    /* The stepper under the table replaces the native bar, as in ScrollArea. */
    scrollbar-width: none;
  }
  .openui-dashboard-table-wrap::-webkit-scrollbar {
    display: none;
  }
  /* A table with a totals row fills its card: the spacer row above the totals takes the spare height
     (every other row keeps its own height), so the totals sit on the card's bottom edge. */
  .openui-dashboard-table-wrap:has(.openui-dashboard-table-spacer) {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .openui-dashboard-table:has(.openui-dashboard-table-spacer) {
    flex: 1 1 auto;
    --openui-dashboard-table-row-height: 1px;
  }
  /* goober cannot scope a selector after :has(). Inherit the row height only in tables
     with a spacer, and let the spacer keep its automatic height to absorb the spare room. */
  .openui-dashboard-table tr {
    height: var(--openui-dashboard-table-row-height, auto);
  }
  .openui-dashboard-table .openui-dashboard-table-spacer {
    height: auto;
  }
  .openui-dashboard-table-spacer td {
    padding: 0;
    border: 0;
    background: none;
    pointer-events: none;
  }
  .openui-dashboard-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
  }
  .openui-dashboard-table th {
    position: sticky;
    top: 0;
    padding: 0 12px 10px;
    border-bottom: 1px solid var(--openui-dashboard-border);
    background: var(--openui-dashboard-surface);
    font-size: 12px;
    font-weight: 500;
    text-align: left;
    color: var(--openui-dashboard-ink-muted);
    white-space: nowrap;
  }
  .openui-dashboard-table th button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    transition: color 150ms;
  }
  .openui-dashboard-table th button:hover {
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-table td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--openui-dashboard-grid);
    color: var(--openui-dashboard-ink);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  /* Edge cells keep the 12px cell padding, so a row's hover fill and the
   total band reach past the text on both sides; the wrap's bleed is 12px
   shorter, so the text still lines up with the card's content edge. */
  .openui-dashboard-table th:first-child,
  .openui-dashboard-table td:first-child {
    padding-left: 12px;
  }
  .openui-dashboard-table th:last-child,
  .openui-dashboard-table td:last-child {
    padding-right: 12px;
  }
  .openui-dashboard-table tbody tr:hover td {
    background: var(--openui-dashboard-surface-subtle);
  }
  /* The total row is its own quiet band: an opaque subtle fill (it also rides
   the sticky first column), rounded ends, no heavy rule above. */
  .openui-dashboard-table tfoot td {
    border-bottom: 0;
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, var(--openui-dashboard-surface));
    font-weight: 600;
  }
  .openui-dashboard-table tfoot td:first-child {
    border-radius: var(--openui-dashboard-radius-sm) 0 0 var(--openui-dashboard-radius-sm);
    /* Wins over the sticky first-column surface fill. */
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, var(--openui-dashboard-surface));
  }
  .openui-dashboard-table tfoot td:last-child {
    border-radius: 0 var(--openui-dashboard-radius-sm) var(--openui-dashboard-radius-sm) 0;
  }
  .openui-dashboard-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .openui-dashboard-table th.openui-dashboard-num {
    text-align: right;
  }
  .openui-dashboard-table th.openui-dashboard-num button {
    flex-direction: row-reverse;
  }
  .openui-dashboard-cell-muted {
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-cell-primary {
    font-weight: 500;
  }
  .openui-dashboard-cell-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 112px;
  }
  .openui-dashboard-cell-bar-track {
    flex: 1;
    height: 6px;
    transition: transform 150ms;
    border-radius: 999px;
    background: var(--openui-dashboard-neutral-soft);
    overflow: hidden;
  }
  /* The hovered row's bar grows from 6px to 8px, alongside the row's band. */
  .openui-dashboard-table tbody tr:hover .openui-dashboard-cell-bar-track {
    transform: scaleY(1.34);
  }
  .openui-dashboard-cell-bar-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background-color: var(
      --openui-dashboard-series-1
    ); /* -color, so the texture class keeps its image */
  }
  /* Sparklines in cells are compact so a Trend column doesn't stretch the rows. */
  .openui-dashboard-table .openui-dashboard-kpi-spark {
    width: 66px;
    height: 24px;
  }
  /* Category chips: neutral, soft-cornered, a hairline stroke. A status chip
   leads with its icon tile, inset so the corners stay concentric. */
  .openui-dashboard-cell-chips {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .openui-dashboard-cell-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 22px;
    padding: 0 8px;
    border: 1px solid var(--openui-dashboard-border-strong);
    border-radius: calc(var(--openui-dashboard-radius-sm) - 2px);
    background: var(--openui-dashboard-surface);
    font-size: 12px;
    color: var(--openui-dashboard-ink);
    white-space: nowrap;
  }
  /* Link cells: the address without https://, a small arrow, underline on hover. */
  .openui-dashboard-cell-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 220px;
    color: var(--openui-dashboard-ink);
    text-decoration: none;
  }
  .openui-dashboard-cell-link > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .openui-dashboard-cell-link > svg {
    flex: none;
    width: 12px;
    height: 12px;
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-cell-link:hover > span {
    text-decoration: underline;
    text-decoration-color: var(--openui-dashboard-ink-muted);
    text-underline-offset: 2px;
  }
  .openui-dashboard-cell-link:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
  /* Person cells: an initials avatar, then the name. Avatars are the one fully
   round element besides dots. */
  .openui-dashboard-cell-person {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .openui-dashboard-avatar {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--openui-dashboard-ink) 8%, var(--openui-dashboard-surface));
    font-size: 12px;
    font-weight: 500;
    color: var(--openui-dashboard-ink-secondary);
  }
  /* Status is the one coloured chip: a tint of its tone with the darker tone
   for icon and text. Plain categories stay neutral. */
  .openui-dashboard-cell-status {
    /* Equal insets: the shape sits 8px in, as the text ends 8px from the right. */
    padding: 0 8px;
    border-color: color-mix(
      in srgb,
      var(--openui-dashboard-status, var(--openui-dashboard-ink-muted)) 28%,
      transparent
    );
    background: color-mix(
      in srgb,
      var(--openui-dashboard-status, var(--openui-dashboard-ink-muted)) 12%,
      var(--openui-dashboard-surface)
    );
    font-weight: 500;
    color: var(--openui-dashboard-status-ink, var(--openui-dashboard-ink-secondary));
  }
  .openui-dashboard-cell-status > svg {
    flex: none;
    width: 13px;
    height: 13px;
  }
  /* The frozen first column caps its width and ends long values with "…". */
  .openui-dashboard-table td:first-child > .openui-dashboard-cell-clip {
    display: block;
    max-width: min(240px, 45cqi);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* More columns past the right edge: the edge fades, like every other overflow. */
  .openui-dashboard-table-wrap[data-more] {
    mask-image: linear-gradient(to right, black calc(100% - 40px), transparent);
  }
  /* The rule under the header runs the card's full width, edge to edge: the
   edge header cells reach out over the table's 12px bleed. */
  .openui-dashboard-table th:first-child::after,
  .openui-dashboard-table th:last-child::after {
    content: "";
    position: absolute;
    bottom: -1px;
    width: calc(var(--openui-dashboard-space-xl) - 12px);
    border-bottom: 1px solid var(--openui-dashboard-border);
    pointer-events: none;
  }
  .openui-dashboard-table th:first-child::after {
    right: 100%;
  }
  .openui-dashboard-table th:last-child::after {
    left: 100%;
  }
  /* Group headings: the group name and its count on a subtly filled band,
   the same fill and rounded ends as the totals row. */
  .openui-dashboard-table tbody tr.openui-dashboard-table-group td {
    padding-top: 7px;
    padding-bottom: 7px;
    border-bottom: 0;
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, var(--openui-dashboard-surface));
    font-size: 12px;
    font-weight: 500;
    color: var(--openui-dashboard-ink-secondary);
  }
  .openui-dashboard-table tbody tr.openui-dashboard-table-group td:first-child {
    border-radius: var(--openui-dashboard-radius-sm);
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, var(--openui-dashboard-surface));
  }
  /* The band spans every column, so the band scrolls with them while its label
   stays pinned at the left. */
  .openui-dashboard-table tbody tr.openui-dashboard-table-group td:first-child {
    position: static;
    box-shadow: none;
  }
  .openui-dashboard-group-label {
    position: sticky;
    left: 12px;
  }
  .openui-dashboard-group-label > span {
    margin-left: 6px;
    font-weight: 400;
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-table tbody tr.openui-dashboard-table-group:hover td,
  .openui-dashboard-table tbody tr.openui-dashboard-table-group:hover td:first-child {
    background: color-mix(in srgb, var(--openui-dashboard-ink) 3%, var(--openui-dashboard-surface));
  }
  /* The row above a group band drops its rule, so the band reads on its own (Table marks it:
     goober can't scope his tr:has(+ tr.table-group) td). */
  .openui-dashboard-table tbody tr[data-before-group] td {
    border-bottom-color: transparent;
  }
  /* 4px of air under the header rule and above the totals band: spacer rows,
   so neither a group band nor a row's hover changes size. */
  .openui-dashboard-table tbody::before {
    content: "";
    display: block;
    height: 4px;
  }
  .openui-dashboard-table[data-totals] tbody::after {
    content: "";
    display: block;
    height: 4px;
  }
  /* A status-dots cell keeps its marks on one line. */
  .openui-dashboard-table .openui-dashboard-kpi-status-dots {
    flex-wrap: nowrap;
  }
  /* The totals band follows the last row directly, with no rule above it. */
  .openui-dashboard-table[data-totals] tbody tr:last-child td {
    border-bottom-color: transparent;
  }
  /* The sideways stepper sits top right of the card (which the layout positions), level with its
   title. When the card has its own header controls there, it drops to the top of the body
   instead, right-aligned above the table. */
  .openui-dashboard-scroll-step.openui-dashboard-table-step {
    position: absolute;
    top: calc(var(--openui-dashboard-space-lg) - 2px);
    right: var(--openui-dashboard-space-xl);
    left: auto;
    bottom: auto;
    transform: none;
    box-shadow: none;
  }
  /* His .card:has(.card-controls) .scroll-step.table-step: every Card renders that toolbar, so it
     always applied; written without the :has(), which goober can't scope. */
  .openui-dashboard-card
    .openui-dashboard-card-body
    .openui-dashboard-scroll-step.openui-dashboard-table-step {
    position: static;
    align-self: flex-end;
  }
  /* Pager: compact and right-aligned — ‹ 1 2 3 › — soft-cornered steps, the
   current page marked by a simple underline. */
  .openui-dashboard-table-pager {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    font-size: 12px;
    color: var(--openui-dashboard-ink-muted);
  }
  .openui-dashboard-pager-pages {
    display: inline-flex;
    align-items: center;
    gap: 0;
  }
  .openui-dashboard-pager-step,
  .openui-dashboard-pager-page {
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    height: 24px;
    padding: 0 4px;
    border: 1px solid transparent;
    border-radius: calc(var(--openui-dashboard-radius-sm) - 2px);
    background: transparent;
    font: inherit;
    font-variant-numeric: tabular-nums;
    color: var(--openui-dashboard-ink-secondary);
    cursor: pointer;
    transition:
      background 150ms,
      border-color 150ms,
      color 150ms;
  }
  .openui-dashboard-pager-step {
    padding: 0;
    border-color: var(--openui-dashboard-border-strong);
    background: var(--openui-dashboard-surface);
  }
  .openui-dashboard-pager-step svg {
    width: 12px;
    height: 12px;
  }
  .openui-dashboard-pager-step:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--openui-dashboard-ink) 18%, transparent);
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-pager-page:hover {
    background: var(--openui-dashboard-surface-subtle);
    color: var(--openui-dashboard-ink);
  }
  .openui-dashboard-pager-page[aria-current="page"] {
    font-weight: 500;
    color: var(--openui-dashboard-ink);
    text-decoration: underline;
    text-decoration-thickness: 1.5px;
    text-underline-offset: 4px;
  }
  .openui-dashboard-pager-gap {
    min-width: 16px;
    text-align: center;
  }
  .openui-dashboard-pager-step:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .openui-dashboard-pager-step:focus-visible,
  .openui-dashboard-pager-page:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }

  .openui-dashboard-sort {
    display: inline-flex;
    opacity: 0;
    transition: opacity 150ms;
  }
  .openui-dashboard-sort svg {
    width: 10px;
    height: 10px;
  }
  .openui-dashboard-sort[data-asc] svg {
    transform: rotate(180deg);
  }
  .openui-dashboard-table th:hover .openui-dashboard-sort {
    opacity: 0.4;
  }
  .openui-dashboard-table th[aria-sort] .openui-dashboard-sort {
    opacity: 1;
  }

  /* Wide tables scroll sideways on narrow cards; the first column stays put. */
  .openui-dashboard-table th:first-child,
  .openui-dashboard-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--openui-dashboard-surface);
    /* Opaque cover for the edge-bleed gutter the columns scroll through. */
    box-shadow: calc(12px - var(--openui-dashboard-space-xl)) 0 0 var(--openui-dashboard-surface);
  }
  .openui-dashboard-table th:first-child {
    z-index: 2;
  }
  /* Opaque mix: a translucent hover fill on the frozen column would let the
   scrolled columns show through underneath it. */
  .openui-dashboard-table tbody tr:hover td:first-child {
    background: color-mix(in srgb, var(--openui-dashboard-ink) 4%, var(--openui-dashboard-surface));
  }

  .openui-dashboard-table th button:focus-visible {
    outline: 2px solid var(--openui-dashboard-accent);
    outline-offset: 1px;
  }
  @supports not selector(::-webkit-scrollbar) {
    .openui-dashboard-table-wrap {
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--openui-dashboard-ink) 10%, transparent) transparent;
    }
  }
`,
] as const;
