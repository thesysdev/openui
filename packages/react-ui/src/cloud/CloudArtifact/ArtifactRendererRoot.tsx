"use client";

import {
  createInterpreterToolProvider,
  useArtifactPollInterval,
  useArtifactStorage,
  useArtifactStream,
  type ArtifactSummary,
  type Interpreter,
} from "@openuidev/react-headless";
import {
  readSourceTarget,
  type McpClientLike,
  type OpenUIError,
  type SourceTarget,
} from "@openuidev/react-lang";
import clsx from "clsx";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import { shallow } from "zustand/shallow";
import { cacheFor, type ArtifactCache } from "./artifactCache";
import { parseArtifactReference } from "./artifactReference";
import { names, styles } from "./cloudArtifact.styles";
import {
  ContentConfigContext,
  createSourcesStore,
  ProvenanceContext,
  RendererStateContext,
  type ArtifactRendererState,
  type ContentConfig,
  type ProvenanceContextValue,
} from "./contexts";
import { toolError, type ArtifactError } from "./errors";
import {
  Chrome,
  ChromeActions,
  ChromeLoader,
  ChromeTitle,
  CloseButton,
  Content,
  EditedNotice,
  Error as ErrorSlot,
  Loading,
  Pending,
  Preview,
  PreviewDescription,
  PreviewError,
  PreviewLoader,
  PreviewTitle,
  Provenance,
  ProvenanceToggle,
  RegionProvider,
} from "./slots";
import { useQueryResultCache } from "./useQueryResultCache";

/** Props every artifact renderer takes. */
export interface ArtifactRendererBaseProps {
  /**
   * The tool's result, unchanged. The renderer reads the artifact from it.
   *
   * Without `response`, `id` or `content`, the renderer is pending: the tool call that makes the
   * artifact is still running, and the `Pending` slot shows. It keeps showing while a dashboard is
   * built, until it starts writing. Unmount it if the call ends without a result.
   */
  response?: string | null;
  /** Instead of `response`, the artifact's id. */
  id?: string;
  /** The artifact's saved content, if you keep artifacts in your own storage. */
  content?: string;
  /**
   * `true` (default): a preview card that opens the artifact. `false`: standalone, inline,
   * framed by the `Chrome` you pass, or with no frame without one.
   */
  preview?: boolean;
  /** The element the artifact opens in, such as a side panel. Omit to open it under the card. */
  renderInHtmlElement?: HTMLElement | null;
  /** Controlled open state. Without it, the renderer manages it. */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Start open, when the renderer manages the open state. */
  defaultOpen?: boolean;
  /** Added to the artifact's root element. */
  className?: string;
  /** Receives the artifact's error, if any, with `Renderer`'s own. */
  onError?: (errors: Array<OpenUIError | ArtifactError>) => void;
  /** Buttons in the open artifact's bar, next to its close button. A `Chrome` slot's `actions` win. */
  actions?: ReactNode;
  /**
   * How often the artifact checks for a newer version, a rename or an access change, in ms
   * (at least 3s), while the renderer is open: a standalone one always is, a card once opened.
   * A newer version replaces the one on screen; a deleted or unshared artifact shows an error.
   * Hidden tabs don't check. `false`: never. Default: `OpenUICloudProvider`'s
   * `pollInterval`, else 30s.
   */
  pollInterval?: number | false;
  /** Slots: `Preview` and `Chrome`. */
  children?: ReactNode;
}

/** What a renderer gets to draw the artifact itself. */
export interface RenderContentArgs {
  /** The artifact's program; grows while it streams. `null` before any content arrives. */
  program: string | null;
  isStreaming: boolean;
  /** Runs the artifact's data tools through the interpreter, for `Renderer`'s `toolProvider`. */
  toolProvider?: McpClientLike;
  /** Changes when live data is retried: use it as a `key` to remount and re-run queries. */
  rendererKey: number;
  /** Report errors from rendering; they reach the renderer's `onError`. */
  onError: (errors: OpenUIError[]) => void;
}

export interface ArtifactRendererRootProps extends ArtifactRendererBaseProps {
  interpreter?: Interpreter;
  /** Inspect mode, its toggle and panel. Live renderers only. */
  enableProvenance?: boolean;
  renderContent: (args: RenderContentArgs) => ReactNode;
}

const NO_ID_ERROR: ArtifactError = {
  source: "artifact",
  code: "not-found",
  message: "This response doesn’t reference an artifact.",
};
const DELETED_ERROR: ArtifactError = {
  source: "artifact",
  code: "not-found",
  message: "This artifact was deleted.",
};

/** How often a shown artifact checks for changes when neither the renderer nor the provider says. */
const DEFAULT_POLL_INTERVAL = 30_000;

/** A `pollInterval` to use: `false` or a finite number. Anything else (`NaN`, `Infinity`) counts as unset. */
const usableInterval = (value: number | false | undefined) =>
  value === false || Number.isFinite(value) ? value : undefined;

const noopSubscribe = () => () => {};
const notDeleted = () => false;
const notCached = () => undefined;

/** One field of the artifact's cached summary: only a change to that field re-renders. */
function useCachedField<K extends "title" | "isOwner" | "isEditable">(
  cache: ArtifactCache | null,
  id: string | null,
  key: K,
): ArtifactSummary[K] | undefined {
  return useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    () => (cache && id ? cache.get(id)?.[key] : undefined),
    notCached,
  );
}

/** `value`, or the last one while all its fields are the same, so a context value only changes when they do. */
function useShallowStable<T extends object>(value: T): T {
  const ref = useRef(value);
  if (!shallow(ref.current, value)) ref.current = value;
  return ref.current;
}

type Build = "none" | "waiting" | "streaming";

/**
 * Pending while the tool call runs, and on through a dashboard's build until it has content, fails
 * or its stream ends. A build is one that was pending, or whose stream reports a step (a reload
 * mid-build); a saved artifact opening is never pending.
 */
function useBuildPending({
  noResponse,
  hasContent,
  failed,
  isStreaming,
  hasStep,
}: {
  noResponse: boolean;
  hasContent: boolean;
  failed: boolean;
  isStreaming: boolean;
  hasStep: boolean;
}): boolean {
  const [build, setBuild] = useState<Build>("none");
  let next = build;
  if (hasContent || failed) next = "none";
  else if (next === "none" && (noResponse || hasStep)) next = "waiting";
  // Right after the response, the stream hasn't connected yet: wait for it to start.
  if (next === "waiting" && isStreaming) next = "streaming";
  else if (next === "streaming" && !isStreaming) next = "none";
  // During render, so the slot doesn't blink between the response and the stream's first event.
  if (next !== build) setBuild(next);
  return noResponse || next !== "none";
}

/** Top-level children: only the first `Preview` and `Chrome` count, as in AgentInterface. */
function extractRegions(children: ReactNode) {
  let preview: ReactElement | undefined;
  let chrome: ReactElement | undefined;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const slot = child.type === Preview ? "Preview" : child.type === Chrome ? "Chrome" : null;
    if (!slot) return;
    if ((slot === "Preview" ? preview : chrome) !== undefined) {
      console.warn(`[ArtifactRenderer] Multiple <${slot}> slot children — using the first.`);
    } else if (slot === "Preview") preview = child;
    else chrome = child;
  });
  return { preview, chrome };
}

/** The shared renderer: streaming, live data, errors, open state, slots and layout. */
export function ArtifactRendererRoot({
  response,
  id: idProp,
  content,
  preview = true,
  renderInHtmlElement,
  isOpen: isOpenProp,
  onOpenChange,
  defaultOpen = false,
  className,
  actions,
  pollInterval,
  children,
  interpreter,
  onError,
  enableProvenance = false,
  renderContent,
}: ArtifactRendererRootProps) {
  const reference = useMemo(() => parseArtifactReference(response), [response]);
  const id = idProp ?? reference?.id ?? null;
  const ownStorage = content !== undefined;
  // No artifact yet: the tool call that makes it hasn't returned. A response
  // without a reference (even "") is a result, so it's an error instead.
  const noResponse = !idProp && response == null && !ownStorage;

  // ── Open state ──
  const [openState, setOpenState] = useState(defaultOpen);
  const isOpen = isOpenProp ?? openState;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const controlled = isOpenProp !== undefined;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setOpenState(next);
      onOpenChangeRef.current?.(next);
    },
    [controlled],
  );
  const open = useCallback(() => setOpen(true), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const showsContent = !preview || (isOpen && renderInHtmlElement !== null);

  const appPollInterval = useArtifactPollInterval();
  const stream = useArtifactStream({
    id,
    version: reference?.version,
    content,
    // Only while the renderer is open: a standalone one always is, a card once opened.
    pollInterval:
      (!preview || isOpen) &&
      (usableInterval(pollInterval) ?? usableInterval(appPollInterval) ?? DEFAULT_POLL_INTERVAL),
  });

  // A delete, rename or access change from the lists or another renderer's stream
  // (the cache syncs from every stream) reaches every renderer showing the artifact.
  const storage = useArtifactStorage();
  const cache = storage ? cacheFor(storage) : null;
  const isDeleted = useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    cache && id ? () => cache.isDeleted(id) : notDeleted,
    notDeleted,
  );
  const cachedTitle = useCachedField(cache, id, "title");
  const cachedIsOwner = useCachedField(cache, id, "isOwner");
  const cachedIsEditable = useCachedField(cache, id, "isEditable");

  // ── Live data: in-flight calls and failures, from the interpreter ──
  const [inFlight, setInFlight] = useState(0);
  const [toolErrors, setToolErrors] = useState<Record<string, string>>({});
  const [rendererKey, setRendererKey] = useState(0);
  const interpreterRef = useRef(interpreter);
  interpreterRef.current = interpreter;
  const requestRef = useRef<{ id: typeof id; version?: string }>({ id });
  requestRef.current = { id, version: stream.version };

  // A call refused because the artifact moved on: the store says whether to run
  // the queries again (once per refused version) or show the error.
  const reportVersionMismatchRef = useRef(stream.reportVersionMismatch);
  reportVersionMismatchRef.current = stream.reportVersionMismatch;
  const rerunForRef = useRef<{ id: typeof id; version: string } | null>(null);

  const toolProvider = useMemo(() => {
    const setToolError = (toolName: string, message: string | null) =>
      setToolErrors((current) => {
        if (message === null) {
          if (!(toolName in current)) return current;
          const { [toolName]: _cleared, ...rest } = current;
          return rest;
        }
        return current[toolName] === message ? current : { ...current, [toolName]: message };
      });
    const rerunFor = (refused: { id: typeof id; version: string }) => {
      const last = rerunForRef.current;
      if (last?.id === refused.id && last.version === refused.version) return;
      rerunForRef.current = refused;
      setToolErrors({});
      setRendererKey((key) => key + 1);
    };
    return createInterpreterToolProvider({
      getInterpreter: () => interpreterRef.current,
      getRequest: () => requestRef.current,
      onStart: () => setInFlight((count) => count + 1),
      onSettle: (toolName, message, detail) => {
        setInFlight((count) => Math.max(0, count - 1));
        const report = reportVersionMismatchRef.current;
        if (detail?.code !== "ARTIFACT_VERSION_MISMATCH" || !detail.version || !report) {
          setToolError(toolName, message);
          return;
        }
        // A call for the artifact this renderer showed before.
        if (detail.id !== requestRef.current.id) return;
        const refused = { id: detail.id, version: detail.version };
        void report(refused.version).then((answer) => {
          if (refused.id !== requestRef.current.id) return;
          if (answer === "rerun") rerunFor(refused);
          else setToolError(toolName, message);
        });
      },
    });
  }, []);

  // ── Errors and retry ──
  // The artifact's own error is the stream's, as is, so it keeps its identity
  // across renders. It wins over a failed data tool.
  const artifactError = noResponse
    ? null
    : !id && !ownStorage
      ? NO_ID_ERROR
      : isDeleted
        ? DELETED_ERROR
        : stream.error;
  const [failedTool, failedMessage] = Object.entries(toolErrors)[0] ?? [];
  const error = useMemo<ArtifactError | OpenUIError | null>(
    () =>
      artifactError ?? (failedTool && failedMessage ? toolError(failedTool, failedMessage) : null),
    [artifactError, failedTool, failedMessage],
  );

  const streamRetry = stream.retry;
  const retry = useMemo(() => {
    if (!error) return undefined;
    if (error.code === "network-error") return streamRetry;
    if (error.code === "tool-error") {
      return () => {
        setToolErrors({});
        setRendererKey((key) => key + 1);
      };
    }
    return undefined;
  }, [error, streamRetry]);

  // `onError` gets the artifact's errors merged with `Renderer`'s own.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const rendererErrorsRef = useRef<OpenUIError[]>([]);
  const artifactErrorsRef = useRef<ArtifactError[]>([]);
  const handleRendererErrors = useCallback((errors: OpenUIError[]) => {
    rendererErrorsRef.current = errors;
    onErrorRef.current?.([...artifactErrorsRef.current, ...errors]);
  }, []);
  const reportedErrorRef = useRef<ArtifactError | null>(null);
  // Only the artifact's own error is added: `Renderer` already reports failed
  // data tools to `onError` itself.
  useEffect(() => {
    artifactErrorsRef.current = artifactError ? [artifactError] : [];
    if (artifactError === reportedErrorRef.current) return;
    reportedErrorRef.current = artifactError;
    onErrorRef.current?.([...artifactErrorsRef.current, ...rendererErrorsRef.current]);
  }, [artifactError]);

  // A reopened dashboard shows its last results while its queries run.
  const queryResultCache = useQueryResultCache({ toolProvider, storage, requestRef, showsContent });

  // ── Pending: until the artifact has something to show ──
  const program = isDeleted ? null : stream.program;
  const isPending = useBuildPending({
    noResponse,
    hasContent: !!program,
    failed: artifactError !== null,
    isStreaming: stream.isStreaming,
    hasStep: stream.step !== undefined,
  });

  // ── State for useArtifactRenderer() ──
  const isStreaming = stream.isStreaming;
  const isFetching = inFlight > 0;
  const state = useShallowStable<ArtifactRendererState>({
    id,
    // A rename from useArtifactUpdate reaches the cache before the stream.
    title: cachedTitle ?? stream.title ?? reference?.title,
    isOwner: cachedIsOwner ?? stream.isOwner,
    isEditable: cachedIsEditable ?? stream.isEditable,
    isPending,
    isStreaming,
    isFetching,
    isLoading: isPending || isStreaming || isFetching,
    step: stream.step,
    justUpdated: stream.justUpdated,
    error,
    retry,
    isOpen,
    open,
    close,
    preview,
  });
  const contentConfig = useMemo<ContentConfig>(
    () => ({
      isEmpty: !program,
      render: () =>
        renderContent({
          program,
          isStreaming,
          toolProvider:
            interpreter && !queryResultCache.refreshing ? queryResultCache.toolProvider : undefined,
          rendererKey,
          onError: handleRendererErrors,
        }),
    }),
    [
      program,
      isStreaming,
      interpreter,
      queryResultCache.refreshing,
      queryResultCache.toolProvider,
      rendererKey,
      handleRendererErrors,
      renderContent,
    ],
  );

  // ── Provenance: inspect mode and the selected component ──
  const rootRef = useRef<HTMLDivElement>(null);
  const [isInspecting, setInspecting] = useState(false);
  const [selection, setSelection] = useState<SourceTarget | null>(null);
  // The bridge inside `Renderer` writes the program's sources here, for `useArtifactProvenance()`.
  const [sourcesStore] = useState(createSourcesStore);
  const clearSelection = useCallback(() => setSelection(null), []);
  const provenance = useMemo<ProvenanceContextValue | null>(
    () =>
      enableProvenance
        ? { isInspecting, setInspecting, selection, clearSelection, sourcesStore }
        : null,
    [enableProvenance, isInspecting, selection, clearSelection, sourcesStore],
  );
  const inspecting = enableProvenance && isInspecting;
  // While inspecting, pressing a component selects it instead of acting: buttons, links,
  // inputs and menus (some open on pointer down) all stay still.
  const onInspectCapture = useCallback(
    (event: SyntheticEvent) => {
      if (!inspecting) return;
      // Touch keeps scrolling: a tap still selects on its click.
      if (
        event.type === "pointerdown" &&
        (event.nativeEvent as PointerEvent).pointerType !== "mouse"
      ) {
        return;
      }
      // Bounded by this artifact: its bar and panel are not components of an outer Renderer.
      const target = readSourceTarget(event.target, rootRef.current);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.type === "click") setSelection(target);
    },
    [inspecting],
  );
  // While inspecting, what a click would select gets a hover outline, for any component:
  // set on the element directly, so moving the mouse re-renders nothing.
  const hovered = useRef<Element | null>(null);
  const setHovered = useCallback((element: Element | null) => {
    if (hovered.current === element) return;
    hovered.current?.removeAttribute("data-openui-hover");
    element?.setAttribute("data-openui-hover", "");
    hovered.current = element;
  }, []);
  const onInspectHover = useCallback(
    (event: SyntheticEvent) => {
      const target = readSourceTarget(event.target, rootRef.current);
      setHovered(target ? (target.propElement ?? target.element) : null);
    },
    [setHovered],
  );
  const clearHovered = useCallback(() => setHovered(null), [setHovered]);
  useEffect(() => {
    if (!inspecting) clearHovered();
    return clearHovered;
  }, [inspecting, clearHovered]);
  // Another artifact: start over. (Closing or a remount for live data unmounts the bridge,
  // which clears the selection too.)
  // An edit can give a component id (`lead.2`) to another component: start over too.
  useEffect(() => setSelection(null), [id, program]);
  // Outline the selected component and prop.
  useEffect(() => {
    if (!enableProvenance || !selection) return;
    const marked = [selection.element, selection.propElement].filter(
      (el): el is Element => el !== undefined,
    );
    marked.forEach((el) => el.setAttribute("data-openui-selected", ""));
    // A component can replace a selected element, e.g. when data loads: the selection is gone.
    const observer = new MutationObserver(() => {
      if (!marked.every((el) => el.isConnected)) setSelection(null);
    });
    // The content can be portaled into `renderInHtmlElement`, outside the root.
    for (const area of [rootRef.current, renderInHtmlElement]) {
      if (area) observer.observe(area, { childList: true, subtree: true });
    }
    return () => {
      observer.disconnect();
      marked.forEach((el) => el.removeAttribute("data-openui-selected"));
    };
  }, [enableProvenance, selection, renderInHtmlElement]);

  // ── Slots and layout ──
  const regions = useMemo(() => extractRegions(children), [children]);
  const chrome = (
    <RegionProvider region="chrome">
      {regions.chrome ?? <Chrome actions={actions} />}
    </RegionProvider>
  );

  return (
    <RendererStateContext.Provider value={state}>
      <ProvenanceContext.Provider value={provenance}>
        <ContentConfigContext.Provider value={contentConfig}>
          <div
            ref={rootRef}
            className={clsx(styles.root, names.root, className)}
            onClickCapture={inspecting ? onInspectCapture : undefined}
            onPointerDownCapture={inspecting ? onInspectCapture : undefined}
            onMouseDownCapture={inspecting ? onInspectCapture : undefined}
            onMouseOver={inspecting ? onInspectHover : undefined}
            onMouseLeave={inspecting ? clearHovered : undefined}
          >
            {preview ? (
              <>
                <RegionProvider region="preview">{regions.preview ?? <Preview />}</RegionProvider>
                {/* `null`: your element isn't mounted yet (a ref callback hasn't run). */}
                {isOpen &&
                  renderInHtmlElement !== null &&
                  (renderInHtmlElement ? createPortal(chrome, renderInHtmlElement) : chrome)}
              </>
            ) : (
              <RegionProvider region="chrome">{regions.chrome ?? <Content />}</RegionProvider>
            )}
          </div>
        </ContentConfigContext.Provider>
      </ProvenanceContext.Provider>
    </RendererStateContext.Provider>
  );
}

/** The slots every renderer carries, such as `LiveArtifactRenderer.Preview`. */
export const slots = {
  Preview,
  PreviewTitle,
  PreviewDescription,
  PreviewLoader,
  PreviewError,
  Chrome,
  ChromeTitle,
  ChromeLoader,
  ChromeActions,
  EditedNotice,
  CloseButton,
  ProvenanceToggle,
  Content,
  Pending,
  Loading,
  Error: ErrorSlot,
  Provenance,
};
