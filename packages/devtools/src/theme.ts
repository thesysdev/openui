import { createContext, createElement, useContext, type ReactNode } from "react";
import { INTER_FAMILY } from "./ui/interFont";

/**
 * The widget's own theme. Chosen explicitly in Settings (persisted) — the
 * widget never sniffs the host page or the OS, so it looks the same in
 * every app until you change it.
 */
export type ColorMode = "light" | "dark";

export const DEFAULT_COLOR_MODE: ColorMode = "light";

/**
 * Zinc-based UI for the injected widget. Independent of the host design
 * system so the same drawer works in any app.
 */
const LIGHT = {
  bg: "#ffffff",
  // Event cards. Level with the tray in light; lifted off it in dark, where a
  // border alone is too faint to separate them.
  card: "#ffffff",
  // Small outlined controls. They sit on recessed panels, so in dark they need
  // to be lighter than the tray to read as raised.
  controlBg: "#ffffff",
  controlBorder: "#e4e4e7",
  // Inset fills are alpha, not fixed hex, so they read the same shade deeper
  // wherever they land — on the tray, on a card, or inside another panel.
  promoBg: "rgba(24, 24, 27, 0.035)",
  bgMuted: "rgba(24, 24, 27, 0.035)",
  bgSubtle: "#f4f4f5",
  fg: "#18181b",
  fgMuted: "#71717a",
  fgFaint: "#8a8a94",
  fgSecondary: "#52525b",
  fgTertiary: "#3f3f46",
  border: "#e4e4e7",
  borderStrong: "#cfcfd4",
  // LevelIcon chip fills: a step tinted past the surface, softer than the
  // matching -border tokens they sit next to.
  levelNeutral: "#ececee",
  levelWarning: "#ffedd5",
  levelDanger: "#fee2e2",
  borderSubtle: "#f4f4f5",
  overlay: "rgba(24, 24, 27, 0.4)",
  shadow: "0 16px 48px rgba(24, 24, 27, 0.18)",
  shadowSubtle: "0 1px 2px rgba(24, 24, 27, 0.07)",
  trayShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
  toggleBg: "#18181b",
  toggleFg: "#ffffff",
  // Rim on the trays: a hairline of the opposite tone, so the panel edge
  // reads without the weight of a solid border.
  trayRing: "rgba(24, 24, 27, 0.10)",
  toggleBorder: "rgba(0, 0, 0, 0.08)",
  toggleShadow: "0 1px 4px rgba(0, 0, 0, 0.10)",
  toggleError: "#e05252",
  // The error toggle is a light puck in both themes, so the red count disc
  // inside it keeps the same contrast wherever the widget is mounted.
  toggleErrorSurface: "#ffffff",
  toggleErrorRing: "rgba(0, 0, 0, 0.14)",
  inverted: "#18181b",
  invertedFg: "#ffffff",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerStrong: "#991b1b",
  warning: "#c2410c",
  warningBg: "#fff7ed",
  warningBorder: "#fed7aa",
  warningStrong: "#9a3412",
  info: "#1d4ed8",
  infoBg: "#eff6ff",
  infoBorder: "#bfdbfe",
  success: "#047857",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  creditsBg: "#fef3c7",
  creditsFg: "#92400e",
  creditsBorder: "#fde68a",
  creditsGradient: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
  selection: "#bfdbfe",
  syntaxString: "#15803d",
  syntaxState: "#a21caf",
  syntaxNumber: "#c2410c",
  syntaxAtom: "#7c3aed",
  syntaxType: "#1d4ed8",
  syntaxIdent: "#3f3f46",
  syntaxKeyword: "#0f766e",
  syntaxOperator: "#71717a",
  syntaxPunct: "#a1a1aa",
  syntaxText: "#18181b",
} as const;

const DARK = {
  // Lightness is the depth cue: raised surfaces step up from the tray, inset
  // ones step down. One neutral hue throughout, so nothing reads muddy.
  //   inset (alpha) < tray #17171a < card #1f1f23 < chips #2e2e34
  bg: "#17171a",
  card: "#1f1f23",
  // Fill sits just above the card; the stroke a step above the fill, so the
  // control catches light on its edge the way a raised surface does.
  controlBg: "#26262b",
  controlBorder: "#33333a",
  bgMuted: "rgba(0, 0, 0, 0.20)",
  promoBg: "rgba(0, 0, 0, 0.20)",
  bgSubtle: "#2e2e34",
  // Five distinct steps. `fg` stops short of pure white to avoid halation.
  fg: "#ededf0",
  fgTertiary: "#d0d0d6",
  fgSecondary: "#b0b0b8",
  fgMuted: "#9494a0",
  fgFaint: "#74747f",
  border: "#262629",
  borderStrong: "#3f3f47",
  borderSubtle: "#26262b",
  levelNeutral: "#2e2e34",
  levelWarning: "#3b2a13",
  levelDanger: "#3b1f23",
  overlay: "rgba(0, 0, 0, 0.6)",
  shadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
  shadowSubtle: "0 1px 2px rgba(0, 0, 0, 0.4)",
  trayShadow: "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
  toggleBg: "#17171a",
  toggleFg: "#ffffff",
  trayRing: "rgba(255, 255, 255, 0.09)",
  toggleBorder: "rgba(255, 255, 255, 0.18)",
  toggleShadow: "0 1px 4px rgba(0, 0, 0, 0.28)",
  toggleError: "#e05252",
  toggleErrorSurface: "#ffffff",
  toggleErrorRing: "rgba(0, 0, 0, 0.14)",
  inverted: "#ededf0",
  invertedFg: "#17171a",
  // Accent surfaces are the base neutral nudged toward the hue (~10% sat), not
  // the hue itself darkened — that reads as a solid block on a dark tray.
  danger: "#f78b8b",
  dangerBg: "#331a1e",
  dangerBorder: "#5c2a31",
  dangerStrong: "#fcbcbc",
  warning: "#f5a04a",
  warningBg: "#332110",
  warningBorder: "#5c3d1e",
  warningStrong: "#f9c893",
  info: "#86b3fa",
  infoBg: "#17253d",
  infoBorder: "#2b4778",
  success: "#5fd6a4",
  successBg: "#122e23",
  successBorder: "#1f5240",
  creditsBg: "#332110",
  creditsFg: "#f9c893",
  creditsBorder: "#5c3d1e",
  creditsGradient: "linear-gradient(135deg, #332110 0%, #331a18 100%)",
  selection: "#2b4778",
  syntaxString: "#5fd97f",
  syntaxState: "#dd8bf0",
  syntaxNumber: "#f5a04a",
  syntaxAtom: "#b9a6fb",
  syntaxType: "#86b3fa",
  syntaxIdent: "#d0d0d6",
  syntaxKeyword: "#4dd3c0",
  syntaxOperator: "#9494a0",
  syntaxPunct: "#74747f",
  syntaxText: "#ededf0",
} as const;

export type ThemeTokens = { [K in keyof typeof LIGHT]: string };

export const FONT = `"${INTER_FAMILY}", "Inter", system-ui, sans-serif`;
export const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Palette for the chosen mode. Native `colorScheme` still goes on the root. */
export function theme(mode: ColorMode): ThemeTokens {
  return mode === "dark" ? DARK : LIGHT;
}

export function rootStyle(mode: ColorMode): { colorScheme: ColorMode } {
  return { colorScheme: mode };
}

const ModeContext = createContext<ColorMode>(DEFAULT_COLOR_MODE);

export function DevtoolsModeProvider({ mode, children }: { mode: ColorMode; children: ReactNode }) {
  return createElement(ModeContext.Provider, { value: mode, children });
}

/** The mode chosen in Settings, shared with the Debug tray and popup. */
export function useDevtoolsMode(): ColorMode {
  return useContext(ModeContext);
}

/** Tokens for the mode in context. */
export function useTheme(): ThemeTokens {
  return theme(useDevtoolsMode());
}

export function useStyles<T>(factory: (tokens: ThemeTokens) => T): T {
  return factory(useTheme());
}
