"use client";

// Artifacts from OpenUI Cloud: the live and static renderers, their slots and state, and the artifact list.
export { OpenUICloudProvider } from "@openuidev/react-headless";
export type {
  ArtifactAccess,
  ArtifactShare,
  ArtifactShareTarget,
  ArtifactSummary,
  FrontendTokenSource,
  Interpreter,
  InterpreterConfig,
  InterpreterFunction,
  InterpreterRequest,
  OpenUICloudProviderProps,
} from "@openuidev/react-headless";

export {
  useArtifactDelete,
  useArtifactPin,
  useArtifactUnpin,
  useArtifactUpdate,
} from "./CloudArtifact/artifactActions";
export type { ArtifactActionState, ArtifactUpdate } from "./CloudArtifact/artifactActions";
export type { ArtifactToolResponse } from "./CloudArtifact/artifactReference";
export { LiveArtifactRenderer, StaticArtifactRenderer } from "./CloudArtifact/ArtifactRenderer";
export type {
  LiveArtifactRendererProps,
  StaticArtifactRendererProps,
} from "./CloudArtifact/ArtifactRenderer";
export type { ArtifactRendererBaseProps } from "./CloudArtifact/ArtifactRendererRoot";
export {
  useArtifactShare,
  useArtifactShares,
  useArtifactUnshare,
} from "./CloudArtifact/artifactShares";
export type { ArtifactSharesState } from "./CloudArtifact/artifactShares";
export { useArtifactProvenance, useArtifactRenderer } from "./CloudArtifact/contexts";
export type { ArtifactProvenanceState, ArtifactRendererState } from "./CloudArtifact/contexts";
export type { ArtifactError, ArtifactErrorCode } from "./CloudArtifact/errors";
export type {
  ChromeProps,
  CloseButtonProps,
  EditedNoticeProps,
  ErrorProps,
  LoaderProps,
  PartProps,
  PendingProps,
  PreviewProps,
  ProvenanceProps,
  ProvenanceToggleProps,
} from "./CloudArtifact/slots";
export { useArtifactList } from "./CloudArtifact/useArtifactList";
export type {
  ArtifactListFilter,
  ArtifactListState,
  UseArtifactListOptions,
} from "./CloudArtifact/useArtifactList";
// What `describeSource` returns. The Sources popover and menu are drawn by the renderer, not exported.
export type { SourceDescription } from "./SourcesContents/types";
