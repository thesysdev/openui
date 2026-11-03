import { type Theme } from "@openuidev/react-components";

/**
 * Only the tokens the kit changes: the source app's status colours, for text and for the soft tints
 * behind badges and callouts. `ThemeProvider` merges these over its own default theme, so neutrals,
 * spacing and type come from there and keep following the light or dark mode.
 */
export const defaultIntelligentLightTheme: Partial<Theme> = {
  textSuccessPrimary: "#00805d",
  successBackground: "#edf9f2",
  textAlertPrimary: "#8a5300",
  alertBackground: "#ffefc7",
  textDangerPrimary: "#c1322c",
  dangerBackground: "#fff0ee",
  textPurplePrimary: "#7040c1",
  purpleBackground: "#f4f0ff",
  textPinkPrimary: "#b7377c",
  pinkBackground: "#fff0f6",
};

export const defaultIntelligentDarkTheme: Partial<Theme> = {
  textSuccessPrimary: "#5bcf9c",
  successBackground: "#13291f",
  textAlertPrimary: "#f0b84f",
  alertBackground: "#30250f",
  textDangerPrimary: "#ff7d74",
  dangerBackground: "#3a1b19",
  textPurplePrimary: "#b49cff",
  purpleBackground: "#261f3a",
  textPinkPrimary: "#f28cc0",
  pinkBackground: "#371b2a",
};
