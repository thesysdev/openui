/**
 * AI-integration surface for the Intelligent UI kit.
 *
 * The library is keyed on `Col` as root and carries primitives a model arranges
 * itself, the widgets it cannot draw (a street map, a sandboxed HTML page) and
 * generic @functions. The five `openuiIntelligent*` names mirror the dashboard
 * kit's `openuiDashboard*`.
 */
export {
  openuiIntelligentAdditionalRules,
  openuiIntelligentComponentGroups,
  openuiIntelligentExamples,
  openuiIntelligentLibrary,
  openuiIntelligentPromptOptions,
} from "./lib/openuiIntelligentLibrary";

export { intelligentComponents } from "./lib/defineComponents";

// Runs the library's own action (CopyToClipboard) from a Renderer's onAction.
export { runLibraryAction } from "./lib/Action";

// Where SearchImage, Image and Map fetch from.
export {
  configureIntelligentKit,
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./shared/config";

export {
  IntelligentThemeProvider,
  type IntelligentThemeProviderProps,
} from "./components/IntelligentThemeProvider";
