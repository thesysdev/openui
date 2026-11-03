import { ThemeProvider, useTheme, type Theme, type ThemeMode } from "@openuidev/react-components";
import { createContext, useContext, useMemo, type FC, type ReactNode } from "react";
import { defaultDashboardDarkTheme, defaultDashboardLightTheme } from "./defaultThemes";
const InsideDashboardTheme = createContext(false);

/**
 * Whether a `DashboardThemeProvider` is already above this point. Every provider
 * writes its theme to the shared `.openui-dashboard-theme` selector, so a nested
 * one would append a later sheet with the defaults and undo the outer theme for
 * every dashboard on the page.
 */
export const useIsInsideDashboardTheme = () => useContext(InsideDashboardTheme);

export interface DashboardThemeProviderProps {
  children: ReactNode;
  /** Overrides the mode read from the outer `<ThemeProvider>`. */
  mode?: ThemeMode;
  /** Shallow-merged over the default light Dashboard theme. */
  lightTheme?: Partial<Theme>;
  /** Shallow-merged over the default dark Dashboard theme. */
  darkTheme?: Partial<Theme>;
}

/**
 * Themes the Dashboard surface. Mirrors `ReportThemeProvider` — dashboards
 * render at one scale throughout, so a single `ThemeProvider` scoped to
 * `.openui-dashboard-theme` is enough (no shell/canvas split like
 * Presentation needs).
 *
 * The openui token overrides in `defaultThemes.ts` give the dashboard its denser
 * typography, emitted onto the scope class by openui's `ThemeProvider`.
 */
export const DashboardThemeProvider: FC<DashboardThemeProviderProps> = ({
  children,
  mode: modeOverride,
  lightTheme,
  darkTheme,
}) => {
  const { mode: ambientMode } = useTheme();
  const mode: ThemeMode = modeOverride ?? ambientMode;

  const mergedLight = useMemo<Theme>(
    () => ({ ...defaultDashboardLightTheme, ...lightTheme }),
    [lightTheme],
  );

  const mergedDark = useMemo<Theme>(
    () => ({ ...defaultDashboardDarkTheme, ...darkTheme }),
    [darkTheme],
  );

  return (
    <div className="openui-dashboard-theme" style={{ display: "contents" }}>
      <ThemeProvider
        mode={mode}
        lightTheme={mergedLight}
        darkTheme={mergedDark}
        cssSelector=".openui-dashboard-theme"
      >
        <InsideDashboardTheme.Provider value={true}>{children}</InsideDashboardTheme.Provider>
      </ThemeProvider>
    </div>
  );
};
