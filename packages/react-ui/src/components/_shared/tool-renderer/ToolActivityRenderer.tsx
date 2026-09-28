import {
  artifactViewId,
  parseArtifactViewId,
  useDetailedView,
  useDetailedViewStore,
  useThreadContextStore,
  type ArtifactRendererConfig,
  type ArtifactRendererControls,
  type ParsedArtifact,
  type ToolActivity,
} from "@openuidev/react-headless";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { DetailedViewPanel as DefaultDetailedViewPanel } from "../../AgentInterface/_shared/detailed-view";
import { ToolCallErrorFallback } from "./ToolCallErrorFallback";

/**
 * The subset of `DetailedViewPanel` props the renderer needs. Lets a thread
 * family inject its own panel (the AgentInterface panel differs from the shared
 * one only in its close button) so one renderer module serves all of them.
 *
 * @category Types
 */
export type ToolDetailedViewPanel = ComponentType<{
  viewId: string;
  title?: string;
  children: ReactNode;
}>;

/**
 * Runs a matched renderer for one tool activity via the `parser` contract:
 * reconstruct the raw envelope from the typed activity (`args` = the raw JSON
 * string, `response` = the result or null) so parsers see exactly today's input.
 */
function runRenderer<Props>(
  renderer: ArtifactRendererConfig<Props>,
  activity: ToolActivity,
): ParsedArtifact<Props> | null {
  return renderer.parser(
    { args: activity.toolCall.function.arguments, response: activity.result ?? null },
    { isStreaming: activity.status === "streaming" || activity.status === "executing" },
  );
}

/**
 * Renders a matched artifact renderer for a single {@link ToolActivity}.
 *
 * Lifecycle mirrors the previous `RendererInstance`: run the renderer, register
 * the entry in ThreadContext when `meta` is non-null, and render
 * `preview(props, controls)` inline + `<DetailedViewPanel>` for the side panel.
 * The renderer is wrapped in try/catch — a throw renders an inline fallback
 * instead of blanking the thread.
 *
 * @internal
 */
export function ToolActivityRenderer<Props>({
  renderer,
  activity,
  detailedViewPanel: DetailedViewPanel = DefaultDetailedViewPanel,
  fallback = null,
}: {
  renderer: ArtifactRendererConfig<Props>;
  activity: ToolActivity;
  detailedViewPanel?: ToolDetailedViewPanel;
  /** Rendered when the matched renderer's parse/parser returns `null` (skips) —
   *  lets the caller show a default card instead of nothing. */
  fallback?: ReactNode;
}) {
  const fallbackId = useId();
  const tcStore = useThreadContextStore();
  const dvStore = useDetailedViewStore();

  const isStreaming = activity.status === "streaming" || activity.status === "executing";

  const { parsed, error } = useMemo(() => {
    try {
      return { parsed: runRenderer(renderer, activity), error: null as string | null };
    } catch (e) {
      return { parsed: null as ParsedArtifact<Props> | null, error: String(e) };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    renderer,
    activity.id,
    activity.status,
    activity.toolCall.function.arguments,
    activity.result,
    activity.isError,
  ]);

  const meta = parsed?.meta ?? null;

  // viewId derives from meta when present, otherwise from React's useId so
  // `controls.open` still works for an inline-only renderer.
  const viewId = meta ? artifactViewId(meta.id, meta.version) : fallbackId;

  // Register entry on mount; unregister on unmount or when (id, version) changes.
  useEffect(() => {
    if (!meta) return;
    // Prefer the artifact's REAL kind from the parser (meta.type) so a report
    // lists as "Report" and a deck as "Slides" — even though a single
    // tool-owning renderer (e.g. Presentation) matched the generate/edit tool
    // names and would otherwise stamp its own static type on both. Fall back to
    // the matched renderer's type for parsers that don't set meta.type.
    tcStore.getState().registerArtifact({
      ...meta,
      type: meta.type ?? renderer.type,
      updatedAt: Date.now(),
    });
    return () => tcStore.getState().unregisterArtifact(meta.id, meta.version);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tcStore, renderer.type, meta?.id, meta?.version, meta?.heading, meta?.type]);

  // Keep an OPEN side panel alive when this instance's viewId changes for the
  // same logical artifact (streamed artifact resolves its real id, or version
  // bumps on edit).
  const prevViewIdRef = useRef(viewId);
  useEffect(() => {
    const prev = prevViewIdRef.current;
    if (prev === viewId) return;
    prevViewIdRef.current = viewId;
    const dv = dvStore.getState();
    if (dv.activeDetailedViewId === prev) dv.setActiveDetailedView(viewId);
  }, [viewId, dvStore]);

  // Follow an edit across instances: when a NEWER version of the artifact that's
  // currently open registers, re-point the active view to it.
  useEffect(() => {
    if (!meta) return;
    const dv = dvStore.getState();
    const active = dv.activeDetailedViewId;
    if (!active || active === viewId) return;
    const parsed = parseArtifactViewId(active);
    if (!parsed || parsed.id !== meta.id) return;
    if (meta.version > parsed.version) {
      dv.setActiveDetailedView(viewId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dvStore, viewId, meta?.id, meta?.version]);

  const { isActive, open, close, toggle } = useDetailedView(viewId);
  const [resolvedTitle, setResolvedTitle] = useState<{ viewId: string; title: string } | null>(
    null,
  );
  const setTitle = useCallback(
    (title: string) => {
      setResolvedTitle((previous) =>
        previous?.viewId === viewId && previous.title === title ? previous : { viewId, title },
      );
    },
    [viewId],
  );

  if (error) {
    return <ToolCallErrorFallback error={error} toolName={activity.toolName} />;
  }
  // A failed tool call has no real artifact. The c1 parser still produces a
  // preview from the streamed args (artifact_content), independent of the error
  // result, so `parsed` is non-null — but that preview is never registered and
  // vanishes on refresh. Suppress it on error and show the raw tool card
  // (fallback) instead, so the UI only shows artifacts that actually succeeded
  // — consistent live and after reload.
  if (activity.isError || parsed === null) return <>{fallback}</>;

  const controls: ArtifactRendererControls = {
    isActive,
    isStreaming,
    setTitle,
    open,
    close,
    toggle,
  };

  return (
    <>
      {renderer.preview(parsed.props, controls)}
      <DetailedViewPanel
        viewId={viewId}
        title={
          (resolvedTitle?.viewId === viewId ? resolvedTitle.title : null) ??
          meta?.heading ??
          "Detailed view"
        }
      >
        {renderer.actual(parsed.props, controls)}
      </DetailedViewPanel>
    </>
  );
}
