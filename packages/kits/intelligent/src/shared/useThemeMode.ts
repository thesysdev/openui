"use client";

import { useTheme } from "@openuidev/react-components";

/** Light or dark, from the nearest react-components ThemeProvider, as its own components read it. */
export function useThemeMode(): "light" | "dark" {
  return useTheme().mode === "dark" ? "dark" : "light";
}
