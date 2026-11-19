import { create } from "zustand";
import type { LegendStoreState, StackedLegendItem } from "./types";

/**
 * Factory — one store per LegendStoreProvider instance (NOT a module singleton),
 * so state is scoped to the subtree and SSR-safe.
 */
export const createLegendStore = () => {
  // Publisher counts are tracked outside reactive state (they must not trigger
  // re-renders). Closed over by the actions; per store instance.
  const publisherCounts = new Map<string, number>();

  return create<LegendStoreState>((set) => ({
    entries: {},

    publish: (key, items: StackedLegendItem[], format) =>
      set((s) => {
        const prev = s.entries[key];
        const newKeys = new Set(items.map((it) => it.key));
        // Reconcile hidden state against the new items: drop keys for slices that
        // no longer exist (e.g. after a data swap).
        let nextHidden = (prev?.hiddenKeys ?? []).filter((k) => newKeys.has(k));
        // Never leave zero visible after a publish — if every surviving item
        // would be hidden, reset to all-visible (mirrors the toggle guard).
        if (nextHidden.length >= items.length) nextHidden = [];
        // Drop a stale activeKey that no longer maps to an item.
        const nextActive = prev?.activeKey && newKeys.has(prev.activeKey) ? prev.activeKey : null;
        return {
          entries: {
            ...s.entries,
            [key]: {
              items,
              activeKey: nextActive,
              hiddenKeys: nextHidden,
              format: format ?? prev?.format,
            },
          },
        };
      }),

    unpublish: (key) =>
      set((s) => {
        if (!s.entries[key]) return {};
        const next = { ...s.entries };
        delete next[key];
        return { entries: next };
      }),

    setActive: (key, itemKey) =>
      set((s) => {
        const prev = s.entries[key];
        if (!prev || prev.activeKey === itemKey) return {};
        return {
          entries: { ...s.entries, [key]: { ...prev, activeKey: itemKey } },
        };
      }),

    toggle: (key, itemKey) =>
      set((s) => {
        const prev = s.entries[key];
        if (!prev) return {};
        const hidden = new Set(prev.hiddenKeys);
        if (hidden.has(itemKey)) {
          hidden.delete(itemKey);
        } else {
          // At least one item stays visible — mirrors the local-mode
          // useSeriesVisibility guard so a remote legend can't blank the chart.
          if (prev.items.length - prev.hiddenKeys.length <= 1) return {};
          hidden.add(itemKey);
        }
        return {
          entries: {
            ...s.entries,
            [key]: { ...prev, hiddenKeys: [...hidden] },
          },
        };
      }),

    registerPublisher: (key) => {
      const count = (publisherCounts.get(key) ?? 0) + 1;
      publisherCounts.set(key, count);
      if (count > 1) {
        // Misuse-only path: two charts publishing one key would stomp each other.
        console.warn(
          `[@openuidev/react-ui] Duplicate legendKey "${key}": more than one chart ` +
            `publishes to it. Legends will collide — give each chart a unique legendKey.`,
        );
      }
    },

    unregisterPublisher: (key) => {
      const count = (publisherCounts.get(key) ?? 0) - 1;
      if (count <= 0) publisherCounts.delete(key);
      else publisherCounts.set(key, count);
    },
  }));
};
