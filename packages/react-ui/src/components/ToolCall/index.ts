// Legacy (deprecated) — kept so external imports don't break.
export { BehindTheScenes, type BehindTheScenesProps } from "./BehindTheScenes";
export { ToolCallComponent, type ToolCallProps } from "./ToolCall";

// Compound primitive set + batteries-included compositions.
export { DefaultToolCard } from "./DefaultToolCard";
export { SourceIcon } from "./SourceIcon";
export { TimelineToolCard } from "./TimelineToolCard";
export { ToolCall, defaultLabel, prettyResult, useToolCall } from "./ToolCallPrimitives";
export { ToolCallTimeline, type TimelineStep } from "./ToolCallTimeline";
export {
  ArtifactGlyph,
  ErrorGlyph,
  ImageSearchGlyph,
  SearchGlyph,
  TerminalGlyph,
  ThinkingGlyph,
  WeatherGlyph,
  toolIcon,
  type ToolGlyph,
  type ToolGlyphProps,
} from "./ToolGlyphs";
export {
  ToolLabelsProvider,
  humanizeToolName,
  toolLabel,
  useToolLabels,
  type ToolLabel,
  type ToolLabels,
} from "./toolLabels";
export { extractToolSources, type ToolResultSource } from "./toolSources";
