"use client";

import type { Interpreter } from "@openuidev/react-headless";
import { Renderer, type Library, type RendererProps } from "@openuidev/react-lang";
import { useCallback } from "react";
import {
  ArtifactRendererRoot,
  type ArtifactRendererBaseProps,
  type RenderContentArgs,
} from "./ArtifactRendererRoot";

/** `Renderer`'s props, minus the ones the artifact renderer owns. */
type PassThroughRendererProps<L extends Library> = Omit<
  RendererProps<L>,
  "response" | "library" | "isStreaming" | "toolProvider" | "queryLoader" | "onError" | "children"
>;

export interface StaticArtifactRendererProps<L extends Library = Library>
  extends ArtifactRendererBaseProps, PassThroughRendererProps<L> {
  /** The component library the artifact is built from. */
  library: L;
}

export interface LiveArtifactRendererProps<
  L extends Library = Library,
> extends StaticArtifactRendererProps<L> {
  /** Where the artifact's data tools run: your endpoint (`{ url }`) or an async function. */
  interpreter: Interpreter;
}

/** `Renderer` shows its own spinner while queries load; the `Loading` slot owns that here. */
const NO_QUERY_LOADER = <></>;

/** Both renderers: a live one passes `interpreter`, a static one doesn't. */
function ArtifactRendererImpl<L extends Library>({
  library,
  interpreter,
  onAction,
  onStateUpdate,
  initialState,
  onParseResult,
  publishObservability,
  ...base
}: StaticArtifactRendererProps<L> & { interpreter?: Interpreter }) {
  const renderContent = useCallback(
    ({ program, isStreaming, toolProvider, rendererKey, onError }: RenderContentArgs) => (
      <Renderer
        key={rendererKey}
        response={program}
        library={library}
        isStreaming={isStreaming}
        toolProvider={toolProvider ?? null}
        queryLoader={NO_QUERY_LOADER}
        onAction={onAction}
        onStateUpdate={onStateUpdate}
        initialState={initialState}
        onParseResult={onParseResult}
        onError={onError}
        publishObservability={publishObservability}
      />
    ),
    [library, onAction, onStateUpdate, initialState, onParseResult, publishObservability],
  );
  return <ArtifactRendererRoot {...base} interpreter={interpreter} renderContent={renderContent} />;
}

/**
 * Renders a live artifact, such as a dashboard: built from your components,
 * with live data from your data tools through `interpreter`.
 *
 * @category Components
 */
export function LiveArtifactRenderer<L extends Library>(props: LiveArtifactRendererProps<L>) {
  return <ArtifactRendererImpl {...props} />;
}

/**
 * Renders a static artifact: built from your components, without data tools.
 *
 * @category Components
 */
export function StaticArtifactRenderer<L extends Library>(props: StaticArtifactRendererProps<L>) {
  return <ArtifactRendererImpl {...props} />;
}
