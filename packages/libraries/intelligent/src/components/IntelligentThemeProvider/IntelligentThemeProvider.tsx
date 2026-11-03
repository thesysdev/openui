"use client";

import {
  defaultDarkTheme,
  defaultLightTheme,
  ThemeProvider,
  useTheme,
  type Theme,
  type ThemeMode,
} from "@openuidev/react-components";
import {
  createContext,
  useContext,
  useId,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { defaultIntelligentDarkTheme, defaultIntelligentLightTheme } from "./defaultThemes";

/** The stable class on the provider's wrapper, a target for an app's own CSS. */
export const names = { root: "openui-intelligent-theme" } as const;

const InsideIntelligentTheme = createContext(false);

/** Whether an `IntelligentThemeProvider` is already above this point, so the root doesn't add another. */
export const useIsInsideIntelligentTheme = () => useContext(InsideIntelligentTheme);

export interface IntelligentThemeProviderProps {
  children: ReactNode;
  /** Overrides the mode read from the outer `<ThemeProvider>`. */
  mode?: ThemeMode;
  /** Shallow-merged over the kit's light theme. */
  lightTheme?: Partial<Theme>;
  /** Shallow-merged over the kit's dark theme; `lightTheme` is used when it's left out. */
  darkTheme?: Partial<Theme>;
}

/**
 * Themes the kit's output, like the dashboard kit's `DashboardThemeProvider`: a react-components
 * `ThemeProvider` that follows the outer one's mode and adds the kit's default theme.
 *
 * Two things differ. The outer theme is kept: a token an app changed from react-components' default
 * stays the app's, and only tokens it left alone take the kit's value. And with no props, it sets
 * only the kit's palette, as variables on its wrapper: a full ThemeProvider would write every token
 * there and hide an app's own CSS variables. A mode or theme of yours gets a ThemeProvider, scoped to
 * this provider, so a light and a dark output can share a page.
 */
export function IntelligentThemeProvider({
  children,
  mode: modeOverride,
  lightTheme,
  darkTheme,
}: IntelligentThemeProviderProps) {
  const outer = useTheme();
  const mode: ThemeMode = modeOverride ?? outer.mode;
  const scope = `openui-intelligent-theme-${useId().replace(/[^a-zA-Z0-9-_]/g, "")}`;
  const themed = modeOverride !== undefined || lightTheme !== undefined || darkTheme !== undefined;

  const { theme, palette } = useMemo(() => {
    const builtIn = (mode === "dark" ? defaultDarkTheme : defaultLightTheme) as Record<
      string,
      unknown
    >;
    // The outer theme only says something about this mode when it's in it.
    const base = (mode === outer.mode ? outer.theme : builtIn) as Record<string, unknown>;
    const kit = mode === "dark" ? defaultIntelligentDarkTheme : defaultIntelligentLightTheme;
    const untouched = Object.fromEntries(
      Object.entries(kit).filter(([key]) => base[key] === builtIn[key]),
    );
    const own = mode === "dark" ? (darkTheme ?? lightTheme) : lightTheme;
    return {
      theme: { ...base, ...untouched, ...own } as Theme,
      palette: Object.fromEntries(
        Object.entries(untouched).map(([key, value]) => [cssVar(key), value]),
      ) as CSSProperties,
    };
  }, [mode, outer.mode, outer.theme, lightTheme, darkTheme]);

  const body = (
    <InsideIntelligentTheme.Provider value={true}>{children}</InsideIntelligentTheme.Provider>
  );
  if (!themed) {
    return (
      <div className={names.root} style={{ display: "contents", ...palette }}>
        {body}
      </div>
    );
  }
  return (
    <div className={`${names.root} ${scope}`} style={{ display: "contents" }}>
      <ThemeProvider mode={mode} lightTheme={theme} darkTheme={theme} cssSelector={`.${scope}`}>
        {body}
      </ThemeProvider>
    </div>
  );
}

/** A theme key as react-components writes it: textSuccessPrimary is --openui-text-success-primary. */
const cssVar = (key: string) => `--openui-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
