/**
 * AI-integration surface for the Intelligent UI library.
 *
 * The library is keyed on `Col` as root and carries primitives a model arranges
 * itself, the widgets it cannot draw (a street map, a sandboxed HTML page) and
 * generic @functions.
 */
export { componentGroups, library } from "./lib/library";

export { additionalRules, examples, promptOptions } from "./lib/prompt-options";

export { intelligentComponents } from "./lib/defineComponents";

export { runLibraryAction } from "./lib/Action";

export {
  configureIntelligentKit,
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./shared/config";
