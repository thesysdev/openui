// Public entry point for @openuidev/plotly.
//
// Pairs with @openuidev/react-ui, @openuidev/react-headless, and
// @openuidev/react-lang (peer dependencies) to provide 47 typed Plotly
// components an LLM can address by name in openui-lang, plus a high-level
// <PlotlyChat /> wrapper for one-line chat shells.

// ── The high-level wrapper ──────────────────────────────────────────────────
//
// 99% of users only need this. Drop <PlotlyChat /> on a "use client" page,
// add an /api/chat route, you have a working chat with all 47 chart types.
export { PlotlyChat, type PlotlyChatProps } from "./PlotlyChat";

// ── The library + prompt + assistantMessage ─────────────────────────────────
//
// Use these directly if you want to compose your own chat shell.
export { PlotlyAssistantMessage } from "./AssistantMessage";
export {
  plotlyAdditionalRules,
  plotlyComponentGroups,
  plotlyExamples,
  plotlyLibrary,
  plotlyPromptOptions,
  type PlotlyLibrary,
} from "./library";

// ── OpenUI re-exports (convenience) ─────────────────────────────────────────
//
// These come from peer-dependency packages — re-exporting just so consumers
// can import everything from a single module if they want to.
export {
  BottomTray,
  Copilot,
  FullScreen,
  ThemeProvider,
  createTheme,
  defaultDarkTheme,
  defaultLightTheme,
  type Theme,
  type ThemeMode,
  type ThemeProps,
} from "@openuidev/react-ui";

export {
  identityMessageFormat,
  openAIAdapter,
  openAIConversationMessageFormat,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  openAIResponsesAdapter,
  type AssistantMessage,
  type Message,
  type SystemMessage,
  type ToolMessage,
  type UserMessage,
} from "@openuidev/react-headless";

export {
  Renderer,
  createLibrary,
  defineComponent,
  generatePrompt,
  useIsStreaming,
  useRenderNode,
  useTriggerAction,
  type ActionEvent,
  type ActionPlan,
  type ComponentGroup,
  type Library,
  type LibraryDefinition,
  type OpenUIError,
  type PromptOptions,
} from "@openuidev/react-lang";

// ── Theme / shell / advanced ────────────────────────────────────────────────
export { isDivergingColormap, resolveColormap } from "./shell/colormap";
export { PlotShell, type PlotShellProps } from "./shell/PlotShell";
export { ChartSkeleton, NoDataNotice } from "./shell/skeleton";
export { darkTemplate, defaultConfig, lightTemplate } from "./shell/template";

// NOTE: do not statically re-export Plotly here. plotly.js-dist-min references
// `self` at module load, which crashes Next.js / any SSR environment when the
// package's index is touched on the server. PlotShell loads Plotly lazily via
// React.lazy + dynamic import so the SSR boundary stays clean. Power users
// who want direct access can import "plotly.js-dist-min" themselves inside
// a "use client" boundary.
