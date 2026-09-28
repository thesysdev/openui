# Legend store architecture

Reference for maintainers/agents. Written 2026-07-10, after the
provider-default-key refactor. `README.md` (same folder) is the quick-start;
this file records the internals, invariants, and the decisions behind them.

## Module map

```
shared/core/legend/
  LegendStoreProvider.tsx  provider (store + default-key contexts), hooks:
                           useResolvedLegendKey / useLegendEntry /
                           useLegendPublisher / useLegendBridge
  legendStore.ts           createLegendStore() — Zustand store FACTORY
  legendSelectors.ts       indexToKey / keyToIndex / stackedItemsFromSlices
  types.ts                 LegendEntry, StackedLegendItem, LegendStoreState
  index.ts                 barrel (what the rest of D3Charts imports)

shared/core/StackedLegend/
  StackedLegend.tsx        connected (store-backed) vs presentational split
  StackedLegendView.tsx    pure view — rows, header, scroll affordance

hooks/polar/
  useCategoricalChartOrchestrator.ts  the CHART side of the bridge
```

Public exports (`D3Charts/index.ts`): `LegendStoreProvider`, `useLegendEntry`,
`StackedLegend` + types. The publisher/bridge hooks and
`useResolvedLegendKey` are internal (legend barrel only).

## Data flow

```
            LegendStoreProvider (one store per mount, useRef-lazy)
            ├── LegendStoreContext : the store
            └── LegendKeyContext   : optional default key ("uid")
                        │
   ┌────────────────────┴──────────────────────┐
   │ CHART (Pie/Radial orchestrator)           │ StackedLegend (connected)
   │ resolvedKey = prop ?? contextKey          │ key = prop ?? contextKey
   │                                           │
   │ useLegendPublisher(key, rows, format) ──► entries[key].items
   │ useLegendBridge(key):                     │
   │   reads  entries[key].activeKey ◄──────── onItemHover → setActive(key,…)
   │   reads  entries[key].hiddenKeys ◄─────── onItemToggle → toggle(key,…)
   │   writes setActive on slice hover ──────► row gets --active class
   └───────────────────────────────────────────┘
```

One store holds N entries; each entry is one chart↔legend pair. The key is
the address; the store is the transport.

## Key resolution

`useResolvedLegendKey(key) = key ?? useContext(LegendKeyContext)`

- Explicit `legendKey` prop **always wins** over the provider default.
- Resolution happens in every consumer hook (`useLegendEntry`,
  `useLegendPublisher`, `useLegendBridge`) AND once at the top of the polar
  orchestrator — the orchestrator needs the resolved value itself because its
  hover-sync effect uses the key as a dependency (see below). Double
  resolution is idempotent.
- `StackedLegend` discriminates on `items` (presence → presentational path);
  the connected path treats `legendKey` as optional and resolves it.

## Invariants (enforced in legendStore.ts)

1. **Store per provider.** `createLegendStore()` is a factory; the provider
   instantiates via `useRef`. Never a module singleton — SSR-safe, GC'd with
   the subtree. (`EMPTY_LEGEND_STORE` is a shared module-level _read-only_
   fallback for hook calls outside any provider; nothing ever writes to it.)
2. **One publisher per key.** `registerPublisher` counts mounts per key and
   `console.warn`s on >1. Publisher counts live OUTSIDE reactive state (a
   closed-over Map) so they can't cause re-renders.
3. **Never zero visible slices.** `toggle` refuses to hide the last visible
   item; `publish` reconciles `hiddenKeys` against the incoming items (drops
   keys for vanished slices, resets to all-visible if everything would be
   hidden) and nulls a stale `activeKey`.
4. **Unmount cleanup.** The publisher effect unregisters + unpublishes its
   key, so a chart unmounting removes its entry (the connected legend then
   renders `null`).

## Graceful-degradation matrix

| Situation                           | Chart                                              | StackedLegend             |
| ----------------------------------- | -------------------------------------------------- | ------------------------- |
| No provider                         | bridge `null` → local state, inline legend renders | `null`                    |
| Provider, no key resolvable         | same as above                                      | `null`                    |
| Key resolves, nothing published yet | publishes on mount                                 | `null` until entry exists |
| Key resolves + published            | inline legend suppressed (`usesRemoteLegend`)      | renders entry             |

The "inline legend suppressed" gate is `showLegend && !usesRemoteLegend` in
the chart components; `usesRemoteLegend = bridge != null`.

## Orchestrator subtleties (do not "fix" these)

- The slice-hover → `setActive` effect depends on
  `[hoveredIndex, resolvedLegendKey]` and deliberately **excludes `bridge`**
  (fresh object every render — including it would run the effect every
  render and wipe legend-set highlights). `resolvedLegendKey` is the stable
  proxy for "which bridge is active". It also reads `visibleSlices` through
  a ref for the same reason. A comment in the file documents this (no
  disable directive needed).
- `publish` is driven by `stackedItems`, memoized from `slices` — keep it
  memoized or the publish effect loops.

## Scoping decision (2026-07-10): provider stays LOCAL

One provider per chart+legend composition, wrapped immediately around the
pair. Rationale:

- **Blast radius of one chart.** Key collisions, stale entries, publisher
  leaks — all confined to a subtree that dies with the composition.
- **`useId` is only unique per React root.** Chat surfaces can host multiple
  roots (streaming remounts, portals); a hoisted shared store + `useId` keys
  could genuinely collide. Local stores make that class of bug impossible.
- **No current consumer needs cross-subtree reach.** Hoisting is the
  documented escape hatch for a future _remote_ legend (e.g. one dashboard
  legend panel driving several charts): mount one provider higher, give each
  pair explicit keys. The API needs no changes for that day — that is the
  point of keeping entries key-addressable even though today every store
  holds exactly one entry.

The provider `legendKey` default (added in this refactor) exists purely so
the common one-pair case states the uid once instead of threading it into
both sides — it does not change scoping.

## Test coverage map

- `legendStore.test.ts`, `legendSelectors.test.ts` — store invariants (pure,
  no DOM).
