import { createContext } from "react";

/**
 * The CSS custom properties that style every native-SVG tick/axis label — the
 * `svg-tick-label` mixin (shared/cartesian/chartBase.scss) compiles to
 * `font: var(--openui-text-label-xs); letter-spacing: var(--openui-text-label-xs-letter-spacing)`.
 * Text measurement MUST read the same channel: resolving the font from the JS
 * theme context instead once clipped every axis label inside presentation
 * slides, because a duplicated @openuidev/react-ui module gave the charts a
 * different ThemeContext instance (12px default) than the one the slide's
 * ThemeProvider wrote its 20px tokens to — while the CSS cascade, immune to JS
 * module identity, rendered the 20px var. Same-channel measurement makes the
 * budgets immune to that entire failure class (context splits, portals,
 * out-of-scope rendering).
 */
export const TICK_FONT_CSS_VAR = "--openui-text-label-xs";
export const TICK_LETTER_SPACING_CSS_VAR = "--openui-text-label-xs-letter-spacing";

/**
 * The element whose computed styles carry the theme scope the chart renders
 * under. Provided by the chart containers (ChartShell, CartesianChartLayout)
 * with their persistent container ref, so any measuring component rendered
 * inside them — XAxis, RadarAxisLabels, HeatmapCells, the legend — picks up
 * the render-scope font with no prop threading. Orchestrator-level hooks run
 * ABOVE the provider and pass their own container ref explicitly instead.
 */
export const MeasureFontScopeContext = createContext<React.RefObject<HTMLElement | null> | null>(
  null,
);

/**
 * Measurement-font precedence: the CSS var actually styling the ticks wins;
 * the JS theme token is the fallback (no DOM scope yet — e.g. the render
 * before refs attach); the react-ui default is the floor. Pure — unit-tested
 * without a DOM.
 */
export function resolveMeasureFont(
  cssVarFont: string | null | undefined,
  themeFont: string | null | undefined,
): string {
  const fromCss = cssVarFont?.trim();
  if (fromCss) return fromCss;
  const fromTheme = themeFont?.trim();
  if (fromTheme) return fromTheme;
  return "400 12px/1.25 Inter";
}
