"use client";

import { useSyncExternalStore } from "react";
import type { ThemeMode } from "./types";

const mediaQuery = "(prefers-color-scheme: dark)";

const getSnapshot = (): ThemeMode => (window.matchMedia(mediaQuery).matches ? "dark" : "light");

const getServerSnapshot = (): ThemeMode => "light";

const subscribe = (onStoreChange: () => void): (() => void) => {
  const query = window.matchMedia(mediaQuery);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
};

export function useSystemThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
