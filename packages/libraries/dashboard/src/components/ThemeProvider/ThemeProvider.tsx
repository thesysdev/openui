"use client";

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import { defaultDarkTheme, defaultLightTheme, type Theme } from "./defaultThemes";

type ThemeMode = "light" | "dark";
type ThemeProps = {
  /** Active colour scheme. Defaults to the nearest dashboard ThemeProvider's mode, otherwise `"light"`. */
  mode?: ThemeMode;
  /** Partial overrides for light mode, merged onto the built-in light tokens. */
  lightTheme?: Theme;
  /** Partial overrides for dark mode. When omitted, `lightTheme` applies to both modes. */
  darkTheme?: Theme;
  children?: ReactNode;
};

/**
 * The provider's mode, and its tokens as inline CSS variables. A portal renders outside the
 * provider's element, so it puts `style` on its own root to carry the same tokens.
 */
export const ThemeContext = createContext<{ mode: ThemeMode; style: CSSProperties } | null>(null);

/** `seqInk1` → `--openui-dashboard-seq-ink-1`, `space2xl` → `--openui-dashboard-space-2xl`. */
export function tokenVariable(key: string) {
  return `--openui-dashboard-${key.replace(/[A-Z]|\d+/g, (part) => `-${part.toLowerCase()}`)}`;
}

export function ThemeProvider({ mode: suppliedMode, lightTheme, darkTheme, children }: ThemeProps) {
  const parent = useContext(ThemeContext);
  const mode = suppliedMode ?? parent?.mode ?? "light";

  const value = useMemo(() => {
    const defaults = mode === "light" ? defaultLightTheme : defaultDarkTheme;
    const overrides: Theme | undefined = mode === "light" ? lightTheme : (darkTheme ?? lightTheme);
    const style: Record<string, string> = { colorScheme: mode };
    for (const [key, token] of Object.entries(defaults)) {
      style[tokenVariable(key)] = overrides?.[key as keyof Theme] ?? token;
    }
    return { mode, style: style as CSSProperties };
  }, [mode, lightTheme, darkTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <div data-dashboard-mode={mode} style={{ display: "contents", ...value.style }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function DashboardTheme({ children }: { children: ReactNode }) {
  return useContext(ThemeContext) ? <>{children}</> : <ThemeProvider>{children}</ThemeProvider>;
}
