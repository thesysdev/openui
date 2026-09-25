"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { useSystemThemeMode } from "@openuidev/react-ui";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { createAppTheme } from "@/lib/mui-genui/theme";

type ThemeMode = "light" | "dark";

interface ColorModeContextType {
  mode: ThemeMode;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

/**
 * Material UI theme + a light/dark color mode. Follows the OS scheme until the
 * user toggles it.
 */
export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const systemMode = useSystemThemeMode();
  const [userOverride, setUserOverride] = useState<ThemeMode | null>(null);
  const mode = userOverride ?? systemMode;

  useEffect(() => {
    document.body.setAttribute("data-theme", mode);
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo<ColorModeContextType>(
    () => ({
      mode,
      toggle: () => setUserOverride(mode === "light" ? "dark" : "light"),
    }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeContextType {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within a ColorModeProvider");
  }
  return ctx;
}
