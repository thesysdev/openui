"use client";

import {
  ThemeProvider as BaseThemeProvider,
  useTheme,
  type Theme,
  type ThemeMode,
} from "@openuidev/react-components";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultDarkTheme, defaultLightTheme } from "./defaultThemes";

const InsideTheme = createContext(false);

/**
 * Whether this library's `ThemeProvider` is already above this point. Every provider writes its
 * theme to the shared `.openui-intelligent-theme` selector, so a nested one would append a later
 * sheet with the defaults and undo the outer theme.
 */
export const useIsInsideTheme = () => useContext(InsideTheme);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Overrides the mode read from the outer react-components `<ThemeProvider>`. */
  mode?: ThemeMode;
  /** Shallow-merged over the library's light theme. */
  lightTheme?: Partial<Theme>;
  /** Shallow-merged over the library's dark theme. */
  darkTheme?: Partial<Theme>;
}

/**
 * Themes the library's output, like the dashboard library's `ThemeProvider`: a react-components
 * `ThemeProvider` scoped to `.openui-intelligent-theme`, with the library's status colours merged
 * over react-components' defaults.
 */
export function ThemeProvider({
  children,
  mode: modeOverride,
  lightTheme,
  darkTheme,
}: ThemeProviderProps) {
  const { mode: ambientMode } = useTheme();
  const mode: ThemeMode = modeOverride ?? ambientMode;

  const mergedLight = useMemo<Partial<Theme>>(
    () => ({ ...defaultLightTheme, ...lightTheme }),
    [lightTheme],
  );

  const mergedDark = useMemo<Partial<Theme>>(
    () => ({ ...defaultDarkTheme, ...darkTheme }),
    [darkTheme],
  );

  return (
    <div className="openui-intelligent-theme" style={{ display: "contents" }}>
      <BaseThemeProvider
        mode={mode}
        lightTheme={mergedLight}
        darkTheme={mergedDark}
        cssSelector=".openui-intelligent-theme"
      >
        <InsideTheme.Provider value={true}>{children}</InsideTheme.Provider>
      </BaseThemeProvider>
    </div>
  );
}
