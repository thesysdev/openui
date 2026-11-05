"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/* True once mounted on a page in dark mode; false on the server, so the first
   render always matches. */
export function useDark() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return mounted && resolvedTheme === "dark";
}

const phone = "(max-width: 767px)";
const watchPhone = (cb: () => void) => {
  const m = window.matchMedia(phone);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/* True on phone widths, where the film shows its central 900px. */
export function useNarrow() {
  return useSyncExternalStore(
    watchPhone,
    () => window.matchMedia(phone).matches,
    () => false,
  );
}
