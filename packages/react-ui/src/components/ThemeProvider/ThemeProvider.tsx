import React, { createContext, useContext, useId, useInsertionEffect, useMemo } from "react";
import { defaultDarkTheme, defaultLightTheme } from "./defaultTheme";
import { Theme, ThemeMode } from "./types";
import { themeToCssVars } from "./utils";

/**
 * Props for the {@link ThemeProvider} component.
 */
export type ThemeProps = {
  /** Active color scheme. @default "light" */
  mode?: ThemeMode;
  /** Application content rendered inside the theme context. */
  children?: React.ReactNode;
  /**
   * Partial overrides for **light** mode, merged onto the built-in light
   * defaults.  Omitted keys fall back to the built-in defaults.
   * Preferred over the deprecated `theme` prop.
   */
  lightTheme?: Theme;
  /**
   * Partial overrides for **dark** mode, merged onto the built-in dark
   * defaults.  When omitted, `lightTheme` overrides are applied to both modes
   * so a single set of brand customizations "just works".
   */
  darkTheme?: Theme;
  /**
   * @deprecated Use `lightTheme` instead. Kept for backward compatibility;
   * mapped to `lightTheme` internally. If both `theme` and `lightTheme` are
   * provided, `lightTheme` wins.
   */
  theme?: Theme;
  /**
   * CSS selector where `--openui-*` custom properties are injected.
   * Change this when mounting multiple independent theme scopes.
   * @default "body"
   */
  cssSelector?: string;
};

type ThemeContextType = {
  theme: Theme;
  mode: ThemeMode;
  portalThemeClassName: string;
};

/**
 * React context that carries the resolved theme, active mode, and a CSS class
 * name for portals. Consumed via {@link useTheme}.
 */
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultLightTheme,
  mode: "light",
  portalThemeClassName: "",
});

/**
 * Access the current theme, mode, and portal class name from the nearest
 * {@link ThemeProvider}.
 *
 * @returns An object with:
 *  - `theme` – the fully resolved {@link Theme} object
 *  - `mode` – `"light"` or `"dark"`
 *  - `portalThemeClassName` – a unique CSS class name to apply on portal
 *     containers so they inherit the same `--openui-*` custom properties
 *
 * Falls back to the default light theme when no provider is present.
 *
 * @example
 * ```tsx
 * const { theme, mode, portalThemeClassName } = useTheme();
 * ```
 */
export const useTheme = () => useContext(ThemeContext);

const themes = {
  light: defaultLightTheme,
  dark: defaultDarkTheme,
} as const;

// ---------------------------------------------------------------------------
// Internal context for nesting detection
// ---------------------------------------------------------------------------
const OPENUI_THEME_SENTINEL = Symbol("openui-theme-provider");

type InternalContextType = {
  [OPENUI_THEME_SENTINEL]: true;
  theme: Theme;
  mode: ThemeMode;
  portalThemeClassName: string;
};

const InternalContext = createContext<InternalContextType | null>(null);

// ---------------------------------------------------------------------------
// Dev-mode warning deduplication
// ---------------------------------------------------------------------------
const _devWarned = new Set<string>();

function warnOnce(key: string, message: string) {
  if (_devWarned.has(key)) return;
  _devWarned.add(key);
  console.warn(message);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function cssSafeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

const _knownThemeKeys = new Set(Object.keys(defaultLightTheme));

function validateThemeObject(themeObj: Theme, propName: string) {
  for (const [key, value] of Object.entries(themeObj)) {
    if (value !== undefined && typeof value !== "string" && !Array.isArray(value)) {
      warnOnce(
        `non-string:${propName}:${key}`,
        `[OpenUI] ${propName} key "${key}" has a non-string value (${typeof value}). All theme values should be strings.`,
      );
    }
    if (!_knownThemeKeys.has(key)) {
      warnOnce(
        `unknown-key:${propName}:${key}`,
        `[OpenUI] ${propName} contains unknown key "${key}". It will be ignored. Use createTheme() for typo detection with suggestions.`,
      );
    }
  }
}

/**
 * Injects the OpenUI design-token CSS custom properties (`--openui-*`) into the
 * DOM and provides theme context to all descendant components.
 *
 * Supports automatic scoping when nested inside another ThemeProvider: the inner
 * provider wraps its children in a `<div>` with `display: contents` and injects
 * a scoped style rule instead of targeting `body`.
 *
 * @example
 * ```tsx
 * <ThemeProvider
 *   mode="dark"
 *   lightTheme={createTheme({ interactiveAccentDefault: "oklch(0.6 0.2 260)" })}
 * >
 *   <App />
 * </ThemeProvider>
 * ```
 */

export const ThemeProvider = ({
  mode = "light",
  children,
  lightTheme,
  darkTheme,
  theme: deprecatedTheme,
  cssSelector = "body",
}: ThemeProps) => {
  const id = cssSafeId(useId());
  const parent = useContext(InternalContext);
  const isNested = parent != null;
  const effectiveCssSelector = cssSelector || "body";
  const hasExplicitSelector = effectiveCssSelector !== "body";

  // Resolve the deprecated `theme` prop → `lightTheme` takes precedence
  const userLightTheme = lightTheme ?? deprecatedTheme ?? {};
  const userDarkTheme = darkTheme;

  // ---------------------------------------------------------------------------
  // Dev-mode warnings
  // ---------------------------------------------------------------------------
  if (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production") {
    if (deprecatedTheme !== undefined && lightTheme !== undefined) {
      warnOnce(
        "theme+lightTheme",
        '[OpenUI] Both "theme" and "lightTheme" were passed to ThemeProvider. "lightTheme" takes precedence. Remove the deprecated "theme" prop.',
      );
    }

    if (deprecatedTheme !== undefined && lightTheme === undefined) {
      warnOnce(
        "deprecated-theme",
        '[OpenUI] The "theme" prop on ThemeProvider is deprecated. Use "lightTheme" instead.',
      );
    }

    validateThemeObject(userLightTheme, "lightTheme");
    if (userDarkTheme) {
      validateThemeObject(userDarkTheme, "darkTheme");
    }

    // if (isNested && !hasExplicitSelector) {
    //   warnOnce(
    //     "nested-global",
    //     '[OpenUI] A nested ThemeProvider is targeting "body". The inner provider will auto-scope to avoid overwriting the parent. Pass an explicit cssSelector to opt out.',
    //   );
    // }
  }

  // ---------------------------------------------------------------------------
  // Theme resolution
  // ---------------------------------------------------------------------------
  const resolvedLightTheme = useMemo(
    () => ({ ...themes.light, ...userLightTheme }),
    [userLightTheme],
  );

  const resolvedDarkTheme = useMemo(() => {
    const overrides = userDarkTheme ?? userLightTheme;
    return { ...themes.dark, ...overrides };
  }, [userDarkTheme, userLightTheme]);

  const activeTheme = mode === "light" ? resolvedLightTheme : resolvedDarkTheme;
  const cssVarsString = useMemo(() => themeToCssVars(activeTheme), [activeTheme]);

  const portalClassName = `openui-theme-portal-${id}`;
  const scopedClassName = `openui-theme-${id}`;

  const contextValue = useMemo<ThemeContextType>(
    () => ({ theme: activeTheme, mode, portalThemeClassName: portalClassName }),
    [activeTheme, mode, portalClassName],
  );

  const internalValue = useMemo<InternalContextType>(
    () => ({
      [OPENUI_THEME_SENTINEL]: true as const,
      theme: activeTheme,
      mode,
      portalThemeClassName: portalClassName,
    }),
    [activeTheme, mode, portalClassName],
  );

  // ---------------------------------------------------------------------------
  // Style injection via useInsertionEffect (Step 4)
  // ---------------------------------------------------------------------------
  const useAutoScope = isNested && !hasExplicitSelector;
  const styleSelector = useAutoScope ? `.${scopedClassName}` : effectiveCssSelector;

  useInsertionEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-openui-theme", id);
    style.textContent = `${styleSelector}, .${portalClassName} { ${cssVarsString} }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [cssVarsString, styleSelector, portalClassName, id]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <InternalContext.Provider value={internalValue}>
      <ThemeContext.Provider value={contextValue}>
        {useAutoScope ? (
          <div className={scopedClassName} style={{ display: "contents" }}>
            {children}
          </div>
        ) : (
          children
        )}
      </ThemeContext.Provider>
    </InternalContext.Provider>
  );
};
