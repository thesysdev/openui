import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { createLegendStore } from "./legendStore";
import type { LegendEntry, StackedLegendItem } from "./types";

type LegendStore = ReturnType<typeof createLegendStore>;

export const LegendStoreContext = createContext<LegendStore | null>(null);

/**
 * Default legend key supplied by the nearest provider. Charts and
 * <StackedLegend> fall back to it when they have no explicit `legendKey`
 * prop, so a locally-scoped composition only states its key once — on the
 * provider — instead of threading the same id into both sides.
 */
const LegendKeyContext = createContext<string | undefined>(undefined);

/**
 * Resolve the effective legend key: an explicit prop wins, else the nearest
 * provider's `legendKey`, else undefined (no store participation).
 */
export const useResolvedLegendKey = (key: string | undefined): string | undefined => {
  const contextKey = useContext(LegendKeyContext);
  return key ?? contextKey;
};

/**
 * Shared read-only fallback used when there's no provider. It is never written
 * (no publisher mounts without a provider, and the hooks below only READ from
 * it), so a single module-level instance is safe to share across all
 * subscribers and SSR-safe.
 */
const EMPTY_LEGEND_STORE = createLegendStore();

export const LegendStoreProvider = ({
  legendKey,
  children,
}: {
  /**
   * Optional default key for every keyed consumer in this subtree. The store
   * stays scoped to this provider either way; the key only saves each child
   * from repeating it. Explicit `legendKey` props on children still win.
   */
  legendKey?: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<LegendStore | null>(null);
  if (!ref.current) {
    ref.current = createLegendStore();
  }
  return (
    <LegendStoreContext.Provider value={ref.current}>
      <LegendKeyContext.Provider value={legendKey}>{children}</LegendKeyContext.Provider>
    </LegendStoreContext.Provider>
  );
};

/**
 * Subscribe to a single key's entry. Degrades gracefully: with no provider we
 * read from a stable empty fallback store, so the store hook is ALWAYS called
 * (no conditional-hook violation) and the result is simply `undefined`.
 */
export const useLegendEntry = (key: string | undefined): LegendEntry | undefined => {
  const store = useContext(LegendStoreContext);
  const resolvedKey = useResolvedLegendKey(key);
  const active = store ?? EMPTY_LEGEND_STORE;
  return active(useShallow((s) => (resolvedKey ? s.entries[resolvedKey] : undefined)));
};

/** Chart side: register on mount (dup-warn), publish items on change, clean up on unmount. */
export const useLegendPublisher = (
  key: string | undefined,
  items: StackedLegendItem[],
  format?: "percentage" | "number",
): void => {
  const store = useContext(LegendStoreContext);
  const resolvedKey = useResolvedLegendKey(key);

  useEffect(() => {
    if (!resolvedKey || !store) return;
    store.getState().registerPublisher(resolvedKey);
    return () => {
      store.getState().unregisterPublisher(resolvedKey);
      store.getState().unpublish(resolvedKey);
    };
  }, [resolvedKey, store]);

  useEffect(() => {
    if (!resolvedKey || !store) return;
    store.getState().publish(resolvedKey, items, format);
  }, [resolvedKey, store, items, format]);
};

export interface LegendBridge {
  activeKey: string | null;
  hiddenKeys: Set<string>;
  setActive: (itemKey: string | null) => void;
  toggle: (itemKey: string) => void;
}

/**
 * Chart side: store-backed interaction handles when `key` + provider exist,
 * else `null` (chart falls back to local state). The entry subscription hook is
 * always called; the null decision happens after.
 */
export const useLegendBridge = (key: string | undefined): LegendBridge | null => {
  const store = useContext(LegendStoreContext);
  const resolvedKey = useResolvedLegendKey(key);
  const entry = useLegendEntry(resolvedKey);
  const hiddenKeys = useMemo(() => new Set(entry?.hiddenKeys ?? []), [entry?.hiddenKeys]);

  if (!resolvedKey || !store) return null;
  return {
    activeKey: entry?.activeKey ?? null,
    hiddenKeys,
    setActive: (itemKey) => store.getState().setActive(resolvedKey, itemKey),
    toggle: (itemKey) => store.getState().toggle(resolvedKey, itemKey),
  };
};
