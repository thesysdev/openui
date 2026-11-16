"use client";

import {
  ThemeProvider as ComponentsThemeProvider,
  useTheme as useComponentsTheme,
  type Theme as ComponentsTheme,
  type ThemeMode,
} from "@openuidev/react-components";
import {
  createContext,
  useContext,
  useId,
  useInsertionEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  defaultDarkTheme,
  defaultLightTheme,
  type IntelligentTheme,
  type Theme,
} from "./defaultThemes";

/** Props for the library's {@link ThemeProvider}. */
export type ThemeProviderProps = {
  /** Active colour scheme. Defaults to the nearest library ThemeProvider's mode, otherwise `"light"`. */
  mode?: ThemeMode;
  /** Partial overrides for light mode: react-components' keys and the library's `intelligent*` keys. */
  lightTheme?: Theme;
  /**
   * Partial overrides for dark mode. When omitted, `lightTheme` applies to both modes. A nested
   * provider's overrides apply on top of its parent's.
   */
  darkTheme?: Theme;
  children?: ReactNode;
};

type ThemeContextValue = {
  mode: ThemeMode;
  /** The library's resolved `intelligent*` keys for the active mode. */
  theme: IntelligentTheme;
  /** This provider's overrides for each mode, its parent's included, for a nested provider to build on. */
  overrides: { light: Theme; dark: Theme };
};

/**
 * The nearest library ThemeProvider. Only the library's own provider sets it: a react-components
 * ThemeProvider around the app is ignored, so the library always themes itself the same way.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/** The nearest library ThemeProvider, or `null` outside one. */
export function useIntelligentTheme() {
  return useContext(ThemeContext);
}

const INTELLIGENT_PREFIX = "intelligent";

// The same conversion react-components uses for its keys (`camelToKebab` in its ThemeProvider
// utils), so `intelligentChart1` → `--openui-intelligent-chart-1`.
function camelToKebab(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z])/g, "$1-$2")
    .replace(/([a-z])(\d)/g, "$1-$2")
    .toLowerCase();
}

/** Splits a theme into react-components' keys and the library's `intelligent*` keys. */
function splitTheme(theme: Theme | undefined) {
  const components: Record<string, unknown> = {};
  const intelligent: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme ?? {})) {
    if (key.startsWith(INTELLIGENT_PREFIX) && key.length > INTELLIGENT_PREFIX.length) {
      if (typeof value === "string") intelligent[key] = value;
    } else {
      components[key] = value;
    }
  }
  return { components, intelligent: intelligent as IntelligentTheme };
}

function cssVars(theme: IntelligentTheme) {
  return Object.entries(theme)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => `--openui-${camelToKebab(key)}: ${value as string};`)
    .join(" ");
}

function cssSafeId(id: string) {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

// A <style> with the page's CSP nonce (`window.__nonce__`), as react-components creates its own.
function createStyleTag() {
  const tag = document.createElement("style");
  const nonce = (window as Window & { __nonce__?: string }).__nonce__;
  if (nonce) tag.nonce = nonce;
  return tag;
}

/**
 * Writes the library's variables, colour scheme and text colour where react-components' provider
 * below writes its own: on this provider's scope class, and on that provider's portal class, so a
 * Select menu, Popover or DatePicker that renders outside the scope carries them too.
 */
function IntelligentVariables({
  id,
  scope,
  mode,
  theme,
}: {
  id: string;
  scope: string;
  mode: ThemeMode;
  theme: IntelligentTheme;
}) {
  const { portalThemeClassName } = useComponentsTheme();
  // The text colour too: the library's Text sets none and inherits it, so without this a light
  // library on a dark page would show the page's light text on its light cards.
  const rules = `color-scheme: ${mode}; color: var(--openui-text-neutral-primary); ${cssVars(theme)}`;
  useInsertionEffect(() => {
    const style = createStyleTag();
    style.setAttribute("data-openui-intelligent-theme", id);
    const selectors = [`.${scope}`];
    if (portalThemeClassName) selectors.push(`.${portalThemeClassName}`);
    style.textContent = `${selectors.join(", ")} { ${rules} }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [id, scope, portalThemeClassName, rules]);
  return null;
}

/**
 * Themes the Intelligent UI library: light or dark, with overrides for react-components' keys and
 * the library's own `intelligent*` keys. It works like react-components' ThemeProvider, and is
 * scoped to its own children: it never writes to `body`.
 *
 * - Inside, a react-components ThemeProvider themes the react-components the library draws with
 *   (Button, Select, DatePicker, Chart…) from this provider's mode and keys. A react-components
 *   ThemeProvider around the app is ignored inside it.
 * - A nested provider takes its parent's mode unless it sets one, and builds on its parent's
 *   overrides.
 * - Without one, a response's root `Col` wraps itself in a default provider, in the mode of the
 *   react-components ThemeProvider around the app if there is one.
 */
export function ThemeProvider({
  mode: suppliedMode,
  lightTheme,
  darkTheme,
  children,
}: ThemeProviderProps) {
  const id = cssSafeId(useId());
  const parent = useContext(ThemeContext);
  const mode = suppliedMode ?? parent?.mode ?? "light";
  const scope = `openui-intelligent-theme-${id}`;

  // A nested provider builds on its parent's overrides, so it changes only what it sets itself.
  const overrides = useMemo(
    () => ({
      light: { ...parent?.overrides.light, ...lightTheme },
      dark: { ...parent?.overrides.dark, ...(darkTheme ?? lightTheme) },
    }),
    [parent?.overrides, lightTheme, darkTheme],
  );
  const light = useMemo(() => splitTheme(overrides.light), [overrides.light]);
  const dark = useMemo(() => splitTheme(overrides.dark), [overrides.dark]);

  const theme = useMemo<IntelligentTheme>(
    () =>
      mode === "light"
        ? { ...defaultLightTheme, ...light.intelligent }
        : { ...defaultDarkTheme, ...dark.intelligent },
    [mode, light, dark],
  );

  const context = useMemo<ThemeContextValue>(
    () => ({ mode, theme, overrides }),
    [mode, theme, overrides],
  );

  return (
    <ThemeContext.Provider value={context}>
      <div className={scope} data-openui-intelligent-mode={mode} style={{ display: "contents" }}>
        <ComponentsThemeProvider
          mode={mode}
          cssSelector={`.${scope}`}
          lightTheme={light.components as ComponentsTheme}
          darkTheme={dark.components as ComponentsTheme}
        >
          <IntelligentVariables id={id} scope={scope} mode={mode} theme={theme} />
          {children}
        </ComponentsThemeProvider>
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Wraps `children` in a default ThemeProvider unless a library ThemeProvider is already above. The
 * default takes its mode from a react-components ThemeProvider around the app ("light" without
 * one), so a dark app doesn't get a light answer with no background of its own.
 */
export function RootTheme({ children }: { children: ReactNode }) {
  const library = useContext(ThemeContext);
  const { mode } = useComponentsTheme();
  return library ? <>{children}</> : <ThemeProvider mode={mode}>{children}</ThemeProvider>;
}
