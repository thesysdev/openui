"use client";

// Artifacts from OpenUI Cloud: renderers, their slots and state, and the
// artifact list. Slides and reports are built on `createArtifactRenderer`.
export { OpenUICloudProvider } from "@openuidev/react-headless";
export type {
  ArtifactSummary,
  FrontendTokenSource,
  Interpreter,
  InterpreterConfig,
  InterpreterFunction,
  InterpreterRequest,
  OpenUICloudProviderProps,
} from "@openuidev/react-headless";

export type {
  ArtifactRendererBaseProps,
  RenderContentArgs,
} from "../components/CloudArtifact/ArtifactRendererRoot";
export { useArtifactRenderer } from "../components/CloudArtifact/contexts";
export type { ArtifactRendererState } from "../components/CloudArtifact/contexts";
export { createArtifactRenderer } from "../components/CloudArtifact/createArtifactRenderer";
export type { CreateArtifactRendererOptions } from "../components/CloudArtifact/createArtifactRenderer";
export type { ArtifactError, ArtifactErrorCode } from "../components/CloudArtifact/errors";
export {
  LiveArtifactRenderer,
  StaticArtifactRenderer,
} from "../components/CloudArtifact/LiveArtifactRenderer";
export type {
  LiveArtifactRendererProps,
  StaticArtifactRendererProps,
} from "../components/CloudArtifact/LiveArtifactRenderer";
export type {
  ChromeProps,
  CloseButtonProps,
  ErrorProps,
  LoaderProps,
  PartProps,
  PreviewProps,
} from "../components/CloudArtifact/slots";
export { useArtifactList } from "../components/CloudArtifact/useArtifactList";
export type {
  ArtifactListFilter,
  ArtifactListState,
  UseArtifactListOptions,
} from "../components/CloudArtifact/useArtifactList";
