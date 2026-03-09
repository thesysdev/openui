import { defaultLightTheme } from "./defaultTheme";
import { Theme } from "./types";

/**
 * Convert a camel case string to a kebab case string.
 * @param str - The string to convert.
 * @returns A kebab case string.
 */
export function camelToKebab(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z])/g, "$1-$2")
    .replace(/([a-z])(\d)/g, "$1-$2")
    .toLowerCase();
}

/**
 * Convert a theme object to a string of CSS variables.
 * @param theme - The theme object to convert.
 * @param prefix - The prefix to use for the CSS variables.
 * @returns A string of CSS variables.
 */
export function themeToCssVars(theme: Record<string, unknown>, prefix = "openui"): string {
  return Object.entries(theme)
    .filter(([, v]) => typeof v === "string")
    .map(([key, value]) => `--${prefix}-${camelToKebab(key)}: ${value as string};`)
    .join("\n          ");
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const prev: number[] = Array(n + 1).fill(0) as number[];
  const curr: number[] = Array(n + 1).fill(0) as number[];
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1] ? prev[j - 1]! : 1 + Math.min(prev[j]!, curr[j - 1]!, prev[j - 1]!);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]!;
  }
  return prev[n]!;
}

const _warnedKeys = new Set<string>();

/**
 * Validate a partial theme object in development and return it as-is.
 *
 * Works for both light and dark overrides — call it once per theme object:
 *
 * ```tsx
 * <ThemeProvider
 *   lightTheme={createTheme({ interactiveAccentDefault: "oklch(0.6 0.2 260)" })}
 *   darkTheme={createTheme({ interactiveAccentDefault: "oklch(0.4 0.2 260)" })}
 * />
 * ```
 *
 * In non-production builds this checks every key against the known theme keys
 * and emits a `console.warn` with a "did you mean …?" suggestion for typos.
 * In production the validation code is stripped by bundlers.
 *
 * @param theme - A partial {@link Theme} to validate (light or dark overrides).
 * @returns The same `theme` object, unmodified.
 */
export function createTheme(theme: Theme): Theme {
  if (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production") {
    const knownKeys = Object.keys(defaultLightTheme);
    for (const key of Object.keys(theme)) {
      if (knownKeys.includes(key) || _warnedKeys.has(key)) continue;
      _warnedKeys.add(key);

      let suggestion = "";
      let bestDist = Infinity;
      for (const known of knownKeys) {
        const dist = levenshteinDistance(key, known);
        if (dist < bestDist) {
          bestDist = dist;
          suggestion = known;
        }
      }
      const hint = bestDist <= 3 ? ` Did you mean "${suggestion}"?` : "";
      console.warn(`[OpenUI] Unknown theme key "${key}".${hint}`);
    }
  }
  return theme;
}
