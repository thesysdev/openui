export { ThemeProvider, type ThemeProviderProps } from "./components/ThemeProvider";
export { componentGroups, dashboardComponents, library } from "./lib/library";
// Straight from the modules that load no component code, so a server can import them alone.
export { examples } from "./lib/prompt-options/examples";
export { additionalRules, promptOptions } from "./lib/prompt-options/promptOptions";
