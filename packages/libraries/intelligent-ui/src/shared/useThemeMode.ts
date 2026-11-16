"use client";

import { useIntelligentTheme } from "../components/ThemeProvider";

/** Light or dark, from the nearest library ThemeProvider; light outside one. */
export function useThemeMode(): "light" | "dark" {
  return useIntelligentTheme()?.mode === "dark" ? "dark" : "light";
}
