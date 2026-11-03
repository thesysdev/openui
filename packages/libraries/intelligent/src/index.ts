/**
 * AI-integration surface for the Intelligent UI library.
 *
 * The library is keyed on `Col` as root and carries primitives a model arranges
 * itself, the widgets it cannot draw (a street map, a sandboxed HTML page) and
 * generic @functions.
 */
export {
  openuiIntelligentComponentGroups as componentGroups,
  openuiIntelligentLibrary as library,
} from "./lib/openuiIntelligentLibrary";

export {
  openuiIntelligentAdditionalRules as additionalRules,
  openuiIntelligentExamples as examples,
  openuiIntelligentPromptOptions as promptOptions,
} from "./lib/prompt-options";

export { intelligentComponents } from "./lib/defineComponents";

export { runLibraryAction } from "./lib/Action";

export {
  configureIntelligentKit,
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./shared/config";

export {
  IntelligentUiThemeProvider,
  type IntelligentUiThemeProviderProps,
} from "./components/IntelligentUiThemeProvider";
