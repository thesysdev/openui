import {
  ThemeProvider as BaseThemeProvider,
  useTheme,
  type Theme,
  type ThemeMode,
} from "@openuidev/react-components";
import { createContext, useContext, useMemo, type FC, type ReactNode } from "react";
import { defaultDarkTheme, defaultLightTheme } from "./defaultThemes";
const InsideTheme = createContext(false);

/**
 * Whether this library's `ThemeProvider` is already above this point. Every provider
 * writes its theme to the shared `.openui-dashboard-theme` selector, so a nested
 * one would append a later sheet with the defaults and undo the outer theme for
 * every dashboard on the page.
 */
export const useIsInsideTheme = () => useContext(InsideTheme);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Overrides the mode read from the outer react-components `<ThemeProvider>`. */
  mode?: ThemeMode;
  /** Shallow-merged over the default light Dashboard theme. */
  lightTheme?: Partial<Theme>;
  /** Shallow-merged over the default dark Dashboard theme. */
  darkTheme?: Partial<Theme>;
}

/**
 * Themes the Dashboard surface. Mirrors `ReportThemeProvider` — dashboards
 * render at one scale throughout, so a single react-components `ThemeProvider` scoped to
 * `.openui-dashboard-theme` is enough (no shell/canvas split like
 * Presentation needs).
 *
 * The openui token overrides in `defaultThemes.ts` give the dashboard its denser
 * typography, emitted onto the scope class by react-components' `ThemeProvider`.
 */
export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  mode: modeOverride,
  lightTheme,
  darkTheme,
}) => {
  const { mode: ambientMode } = useTheme();
  const mode: ThemeMode = modeOverride ?? ambientMode;

  const mergedLight = useMemo<Theme>(() => ({ ...defaultLightTheme, ...lightTheme }), [lightTheme]);

  const mergedDark = useMemo<Theme>(() => ({ ...defaultDarkTheme, ...darkTheme }), [darkTheme]);

  return (
    <div className="openui-dashboard-theme" style={{ display: "contents" }}>
      <BaseThemeProvider
        mode={mode}
        lightTheme={mergedLight}
        darkTheme={mergedDark}
        cssSelector=".openui-dashboard-theme"
      >
        <InsideTheme.Provider value={true}>{children}</InsideTheme.Provider>
      </BaseThemeProvider>
    </div>
  );
};
