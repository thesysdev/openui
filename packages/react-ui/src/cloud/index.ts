"use client";

// Artifacts from OpenUI Cloud: the live and static renderers, their slots and state.
export { OpenUICloudProvider } from "@openuidev/react-headless";
export type {
  FrontendTokenSource,
  Interpreter,
  InterpreterConfig,
  InterpreterFunction,
  InterpreterRequest,
  OpenUICloudProviderProps,
} from "@openuidev/react-headless";

export type { ArtifactRendererBaseProps } from "../components/CloudArtifact/ArtifactRendererRoot";
export { useArtifactRenderer } from "../components/CloudArtifact/contexts";
export type { ArtifactRendererState } from "../components/CloudArtifact/contexts";
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
