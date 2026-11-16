/**
 * AI-integration surface for the Intelligent UI library.
 *
 * The library is keyed on `Col` as root and carries primitives a model arranges
 * itself, a widget it cannot draw (a sandboxed HTML page) and
 * generic @functions.
 */
export {
  ThemeProvider,
  type IntelligentTheme,
  type Theme,
  type ThemeProviderProps,
} from "./components/ThemeProvider";
export { componentGroups, library } from "./lib/library";

export { additionalRules, examples, promptOptions } from "./lib/prompt-options";

export { intelligentComponents } from "./lib/defineComponents";
