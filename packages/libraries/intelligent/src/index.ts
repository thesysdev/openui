/**
 * AI-integration surface for the Intelligent UI kit.
 *
 * The library is keyed on `Col` as root and carries primitives a model arranges
 * itself, the widgets it cannot draw (a street map, a sandboxed HTML page) and
 * generic @functions. The five `openuiIntelligent*` names mirror the dashboard
 * kit's `openuiDashboard*`.
 */
export {
  openuiIntelligentComponentGroups,
  openuiIntelligentLibrary,
} from "./lib/openuiIntelligentLibrary";

export {
  openuiIntelligentAdditionalRules,
  openuiIntelligentExamples,
  openuiIntelligentPromptOptions,
} from "./lib/prompt-options";

export { intelligentComponents } from "./lib/defineComponents";

export { runLibraryAction } from "./lib/Action";

export {
  configureIntelligentKit,
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./shared/config";

export {
  IntelligentThemeProvider,
  type IntelligentThemeProviderProps,
} from "./components/IntelligentThemeProvider";
