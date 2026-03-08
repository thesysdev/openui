# ThemeProvider — Agent Guide

## File Map

| File                | Purpose                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ThemeProvider.tsx` | React component, `ThemeContext`, `InternalContext` (nesting detection), `useTheme` hook. Injects `--openui-*` vars into `<head>` via `useInsertionEffect`. |
| `types.ts`          | TypeScript interfaces: `Theme`, `ColorTheme`, `LayoutTheme`, `TypographyTheme`, `EffectTheme`, `ChartColorPalette`.                                        |
| `defaultTheme.ts`   | Builds `defaultLightTheme` / `defaultDarkTheme` (frozen) from the swatch system. Contains `createColorTheme()` and all layout/typography/shadow defaults.  |
| `swatches.ts`       | 18 oklch color families x 14 shades. Exports `swatch()`, `withAlpha()`, `swatchToken()`, `swatchTokens`.                                                   |
| `utils.ts`          | Exports `camelToKebab`, `themeToCssVars`, `createTheme` (dev-mode typo detection with Levenshtein distance suggestions).                                   |
| `index.ts`          | Barrel re-exports from all the above files.                                                                                                                |

## Architecture

```
ThemeProvider mounts
  │
  ├── Resolves active theme: { ...defaults[mode], ...userLightTheme } or { ...defaults[mode], ...userDarkTheme }
  │
  ├── themeToCssVars(theme) → "--openui-background: oklch(...);\n--openui-foreground: ..."
  │
  ├── useInsertionEffect → creates <style data-openui-theme={id}> in <head>
  │   └── Targets body (root) or .openui-theme-{id} (nested, auto-scoped)
  │   └── Also targets .openui-theme-portal-{id} for portaled components
  │
  └── Provides ThemeContext + InternalContext to children
```

**Key internals:**

- `cssSafeId(useId())` — strips CSS-unsafe characters (colons from React 18's `:r0:` format) for use in class names and selectors.
- `InternalContext` with a `Symbol` sentinel detects whether this provider is nested inside another. Nested providers auto-scope via a `<div style="display: contents">` wrapper instead of targeting `body`.
- `cssUtils.scss` is auto-generated at build time by `src/scripts/generate-css-utils.ts` from `defaultLightTheme`, including fallback values.

## Key Patterns

### Adding a New Token

Only **2 files** need editing — the runtime walker (`themeToCssVars`) and the build script (`generate-css-utils.ts`) pick up new keys automatically:

1. **`types.ts`** — add the optional `string` field to the appropriate interface (`ColorTheme`, `LayoutTheme`, etc.).
2. **`defaultTheme.ts`** — set the default value inside `createColorTheme()` (or `layoutTheme`, `typographyTheme`, etc.).

Run `pnpm build` (or `pnpm generate:css-utils`) to regenerate `cssUtils.scss` with the new token and its fallback.

### Naming Convention

```
TS field:      camelCase           e.g. interactiveAccentDefault
CSS variable:  --openui-{kebab}    e.g. --openui-interactive-accent-default
SCSS variable: ${kebab}            e.g. $interactive-accent-default
```

The `camelToKebab()` utility in `utils.ts` handles the conversion, including digits (`space3xs` → `space-3xs`) and consecutive uppercase letters.

### Color Format

All color values **must** use `oklch()` with explicit alpha: `oklch(L C H / alpha)`.

### Props

- **`lightTheme` / `darkTheme`** — the current API for theme overrides.
- **`theme`** — deprecated alias for `lightTheme`. Emits a dev-mode warning.
- **`cssSelector`** — defaults to `"body"`. When set explicitly on a nested provider, bypasses auto-scoping.

### Changing the Brand Color

Edit `LIGHT_SWATCHES.brandSwatch` and/or `DARK_SWATCHES.brandSwatch` in `defaultTheme.ts`. Choose from `BrandSwatchName` (any swatch family except `green`, `yellow`, `red`).

### Adding a New Swatch Family

1. Add the shade map to `BASE_SWATCHES` in `swatches.ts` (14 shades, 25-1000, oklch values).
2. Add the family name to the `SwatchName` union (it's inferred from `BASE_SWATCHES` keys).
3. If it should be usable as a brand color, the `BrandSwatchName` exclusion list may need updating.

## Do NOT Change

- **Swatch oklch values** without design-system coordination — they are copied from `design-system/color-swatches.css`.
- **CSS variable prefix** `--openui-` — it is hardcoded in `ThemeProvider.tsx`, `utils.ts`, `generate-css-utils.ts`, `cssUtils.scss`, and the Tailwind plugin.
- **Component SCSS**: never hardcode colors in component `.scss` files. Always reference `cssUtils` variables.
- **Internal helpers** (`parseOklch`, `clamp01`, `relativeLuminanceFromOklch`, `contrastRatio`, `pickAccentTextFromNeutral`) — these implement WCAG contrast logic and should only change if the accessibility algorithm needs updating.
- **`Object.freeze` on default themes** — prevents accidental mutation of the shared singletons.
- **`cssSafeId` in `ThemeProvider.tsx`** — required because React 18's `useId()` returns colon-containing IDs (`:r0:`) that are invalid in CSS selectors.
