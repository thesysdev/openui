# Legend store — detached, key-addressable legends

The pieces that let a chart and a legend live in **different places in the
tree** but stay in sync: the legend shows the chart's rows, hovering a row
highlights the matching slice, clicking a row hides/shows it.

## The three pieces

| Piece                              | Role                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `LegendStoreProvider`              | Owns one Zustand store, scoped to its subtree. Optionally carries a default `legendKey`. |
| Chart (`PieChart` / `RadialChart`) | Publishes its legend rows into the store, reads hover/hidden state back.                 |
| `StackedLegend`                    | Renders the published rows, writes hover/toggle into the store.                          |

Chart and legend meet on a **key** — the address of one entry inside the
store. Both sides must resolve the _same_ key.

## Usage

**Common case — one chart + one legend. Say the key once, on the provider:**

```tsx
const uid = useId()

<LegendStoreProvider legendKey={uid}>
  <PieChart data={data} legend />   {/* publishes to uid */}
  <StackedLegend />                 {/* reads uid */}
</LegendStoreProvider>
```

**Several pairs in one provider — explicit keys (a prop always beats the
provider default):**

```tsx
<LegendStoreProvider>
  <PieChart legend legendKey="pie" />
  <StackedLegend legendKey="pie" />
  <RadialChart legend legendKey="radial" />
  <StackedLegend legendKey="radial" />
</LegendStoreProvider>
```

**Presentational only — no store at all:**

```tsx
<StackedLegend items={rows} />
```

## Rules of thumb

- **Keep the provider local** — wrap exactly the chart+legend composition,
  not the page. Every composition gets its own store; nothing can cross-talk.
- Use `useId()` for the key so multiple instances on one page never collide.
- A chart with **no resolvable key** (or no provider) simply renders its own
  inline legend. `StackedLegend` with no resolvable key renders nothing.
- Two charts publishing to the same key is a bug — you'll get a console
  warning about a duplicate `legendKey`.
- The store never lets the last visible slice be hidden (toggle is a no-op).

See `ARCHITECTURE.md` in this folder for internals, invariants, and the
scoping decision record.
