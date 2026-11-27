import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query. Returns null during server rendering and
 * hydration, so callers can render a neutral state that matches the server
 * markup, then the live match once the client has taken over.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null,
  );
}
