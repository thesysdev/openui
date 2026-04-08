"use client";

import { fontOverrides, legacyVarCss, swatchVarCss } from "@/shared/theme/openuiThemeBridge";
import type { ThemeMode } from "@components/types";
import { ThemeProvider } from "@openuidev/react-ui/ThemeProvider";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AppThemeProviderProps {
  children: ReactNode;
}

type AppThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "openui-theme";

const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useAppTheme = (): AppThemeContextValue => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
};

export default function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    document.body.setAttribute("data-theme", mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [mode],
  );

  return (
    <AppThemeContext.Provider value={contextValue}>
      <ThemeProvider key={mode} mode={mode} theme={fontOverrides}>
        <style>{`
          body {
            ${legacyVarCss}
            ${swatchVarCss}
          }
        `}</style>
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}
