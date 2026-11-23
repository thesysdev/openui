"use client";

import type { Interpreter } from "@openuidev/react-headless";
import { Renderer, useDataSources, type Library, type RendererProps } from "@openuidev/react-lang";
import { useCallback, useContext, useEffect } from "react";
import {
  ArtifactRendererRoot,
  slots,
  type ArtifactRendererBaseProps,
  type RenderContentArgs,
} from "./ArtifactRendererRoot";
import { ProvenanceContext } from "./contexts";

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
  /**
   * Show where the artifact's data comes from: an inspect toggle in the bar, and a panel for the
   * component clicked while inspecting. Off by default.
   */
  enableProvenance?: boolean;
}

/** `Renderer` shows its own spinner while queries load; the `Loading` slot owns that here. */
const NO_QUERY_LOADER = <></>;

/**
 * Renders nothing. It sits inside `Renderer`, where `useDataSources` works, and while inspecting or
 * selected writes the program's sources to the root's store, for `useArtifactProvenance()`.
 */
function ProvenanceBridge() {
  const provenance = useContext(ProvenanceContext);
  const clearSelection = provenance?.clearSelection;
  // Closed, or remounted for live data: the selected elements are gone.
  useEffect(() => () => clearSelection?.(), [clearSelection]);
  return provenance && (provenance.isInspecting || provenance.selection) ? <SourcesWriter /> : null;
}

function SourcesWriter() {
  const provenance = useContext(ProvenanceContext)!;
  const store = provenance.sourcesStore;
  const sources = useDataSources();
  // Into the store, not the root's state: a write reaches only the panel, never back here.
  useEffect(() => {
    store.set(sources);
  }, [store, sources]);
  useEffect(() => () => store.set(null), [store]);
  return null;
}

/** Both renderers: a live one passes `interpreter`, a static one doesn't. */
function ArtifactRendererImpl<L extends Library>({
  library,
  interpreter,
  enableProvenance,
  onAction,
  onStateUpdate,
  initialState,
  onParseResult,
  publishObservability,
  ...base
}: StaticArtifactRendererProps<L> & { interpreter?: Interpreter; enableProvenance?: boolean }) {
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
      >
        {/* The same children either way, so turning provenance on does not remount the program. */}
        <Renderer.DefaultContent />
        {enableProvenance && <ProvenanceBridge />}
      </Renderer>
    ),
    [
      library,
      onAction,
      onStateUpdate,
      initialState,
      onParseResult,
      publishObservability,
      enableProvenance,
    ],
  );
  return (
    <ArtifactRendererRoot
      {...base}
      interpreter={interpreter}
      enableProvenance={enableProvenance}
      renderContent={renderContent}
    />
  );
}

const LiveArtifactRendererImpl = <L extends Library>(props: LiveArtifactRendererProps<L>) => (
  <ArtifactRendererImpl {...props} />
);

const StaticArtifactRendererImpl = <L extends Library>(props: StaticArtifactRendererProps<L>) => (
  <ArtifactRendererImpl {...props} />
);

/**
 * Renders a live artifact, such as a dashboard: built from your components,
 * with live data from your data tools through `interpreter`.
 *
 * @category Components
 */
export const LiveArtifactRenderer = Object.assign(LiveArtifactRendererImpl, slots);

/**
 * Renders a static artifact: built from your components, without data tools.
 *
 * @category Components
 */
export const StaticArtifactRenderer = Object.assign(StaticArtifactRendererImpl, slots);
