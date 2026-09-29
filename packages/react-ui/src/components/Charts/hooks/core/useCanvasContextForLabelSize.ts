import { useContext, useMemo, useState, useSyncExternalStore } from "react";
import { useTheme } from "../../../ThemeProvider";
import {
  MeasureFontScopeContext,
  TICK_FONT_CSS_VAR,
  TICK_LETTER_SPACING_CSS_VAR,
  resolveMeasureFont,
} from "./measureFontScope";
import { useHydrated } from "./useHydrated";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

// document.fonts one-shot store: canvas measureText before the webfont loads
// uses fallback-font metrics, so every budget must re-measure once real
// metrics exist. Module-level so the subscribe identity is stable.
const subscribeFontsReady = (onStoreChange: () => void) => {
  if (typeof document === "undefined" || document.fonts?.status === "loaded") {
    return () => {};
  }
  let active = true;
  document.fonts?.ready.then(() => {
    if (active) onStoreChange();
  });
  return () => {
    active = false;
  };
};
const getFontsReady = () => typeof document !== "undefined" && document.fonts?.status === "loaded";
const getServerFontsReady = () => false;

export const useCanvasContextForLabelSize = (scopeRef?: React.RefObject<HTMLElement | null>) => {
  const { theme: userTheme } = useTheme();
  const hydrated = useHydrated();
  const contextScope = useContext(MeasureFontScopeContext);
  const fontsReady = useSyncExternalStore(subscribeFontsReady, getFontsReady, getServerFontsReady);
  // Orchestrator hooks pass their container ref explicitly (they run above
  // the providers); components inside ChartShell/CartesianChartLayout inherit
  // the shell's scope via context.
  const scope = scopeRef ?? contextScope;

  // Refs attach at COMMIT, after the render that computes the memo below. On
  // an SSR page the hydrated flip re-renders post-commit so the ref is
  // dereferenceable in time — but on a chart mounted into an ALREADY-hydrated
  // page (a streamed chat response, a slide mounted on deck navigation)
  // hydrated and fontsReady are both true from the first render and nothing
  // would ever re-key the memo: the scope element would stay null and the
  // render-channel font would silently never be read (the theme fallback
  // would stick for the component's lifetime). Read the ref after every
  // commit into state — the bail-out keeps it a no-op except when the element
  // actually appears/changes — so the memo always re-keys once the scope is
  // real. Layout-effect timing re-measures before paint (no fallback-font
  // frame).
  const [scopeEl, setScopeEl] = useState<HTMLElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    setScopeEl((prev) => {
      const el = scope?.current ?? null;
      return prev === el ? prev : el;
    });
  });

  return useMemo(() => {
    const themeFont = userTheme.textLabelXs;

    // Stub on the server AND during the hydration render, so every canvas
    // measurement produces the same geometry the server HTML carries — a
    // `typeof document` branch alone made the hydration render measure REAL
    // text, mismatching the server's zero-width measurements (and React never
    // patches mismatched attributes: the DOM kept the stale server values).
    // Returns zero-width measurements but preserves the font string so
    // parseLineHeight can derive correct line-height on both sides.
    // Note: only measureText and font are implemented — other
    // CanvasRenderingContext2D methods are not available on this stub.
    // (!hydrated alone covers SSR; the document check additionally guards
    // document-less client-style renderers, e.g. react-test-renderer.)
    if (!hydrated || typeof document === "undefined") {
      return {
        measureText: () => ({ width: 0 }),
        font: resolveMeasureFont(null, themeFont),
      } as unknown as CanvasRenderingContext2D;
    }

    // Measure with the font the ticks RENDER with: the same CSS custom
    // property the svg-tick-label mixin applies, read from the chart's own
    // scope element so theme-provider class scoping (e.g. a presentation
    // slide's 20px tokens) is honored. The JS theme token is only the
    // fallback — see measureFontScope.ts for why the CSS channel must win.
    const scopeStyle = scopeEl ? getComputedStyle(scopeEl) : null;
    const font = resolveMeasureFont(scopeStyle?.getPropertyValue(TICK_FONT_CSS_VAR), themeFont);
    const letterSpacing = scopeStyle?.getPropertyValue(TICK_LETTER_SPACING_CSS_VAR).trim();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    context.font = font;
    // Rendered ticks also carry the theme's letter-spacing; canvas measureText
    // ignores it unless set explicitly. Supported in all evergreen browsers;
    // invalid/empty values are safely ignored by the setter's CSS parsing.
    if (letterSpacing && "letterSpacing" in context) {
      (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        letterSpacing;
    }
    // Same shape as the stub: measureText delegating to the real context,
    // plus the ORIGINAL font string. The canvas spec strips line-height in
    // the font getter (setting '400 12px/1.25 Inter' reads back without
    // '/1.25'), so consumers calling parseLineHeight(ctx.font) on the raw
    // context silently fell to the 1.2× fallback and the theme line-height
    // was never honored client-side.
    return {
      measureText: (text: string) => context.measureText(text),
      font,
    } as unknown as CanvasRenderingContext2D;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fontsReady` is a deliberate re-key trigger: its value isn't read in the body, but flipping false→true must rebuild the context so budgets re-measure with real webfont metrics
  }, [userTheme.textLabelXs, hydrated, scopeEl, fontsReady]);
};
