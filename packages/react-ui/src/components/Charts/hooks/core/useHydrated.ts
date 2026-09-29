import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * False during SSR AND during the hydration render — so server HTML and the
 * first client render agree — then true immediately after hydration (React
 * re-renders subscribers when the server snapshot differs). On pure client
 * mounts (no SSR) it is true from the very first render, so client-only
 * consumers pay nothing.
 *
 * Use this instead of `typeof window` checks for anything that affects
 * RENDERED OUTPUT (measured widths, label geometry): a `typeof window` branch
 * flips between the server render and the hydration render, which is exactly
 * the hydration-mismatch React warns about — and mismatched attributes are
 * never patched, so the DOM keeps the stale server value forever.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
