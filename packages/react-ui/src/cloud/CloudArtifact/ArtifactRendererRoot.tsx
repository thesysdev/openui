"use client";

import {
  createInterpreterToolProvider,
  useArtifactStorage,
  useArtifactStream,
  type ArtifactSummary,
  type Interpreter,
} from "@openuidev/react-headless";
import type { McpClientLike, OpenUIError } from "@openuidev/react-lang";
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
} from "react";
import { createPortal } from "react-dom";
import { cacheFor } from "./artifactCache";
import { parseArtifactReference } from "./artifactReference";
import { names, styles } from "./cloudArtifact.styles";
import {
  ContentConfigContext,
  RendererStateContext,
  type ArtifactRendererState,
  type ContentConfig,
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
  PreviewLoader,
  PreviewTitle,
  RegionProvider,
} from "./slots";
import { useQueryResultCache } from "./useQueryResultCache";

/** Props every artifact renderer takes. */
export interface ArtifactRendererBaseProps {
  /**
   * The tool's result, unchanged. The renderer reads the artifact from it.
   *
   * Without `response`, `id` or `content`, the renderer is pending: the tool call that makes the
   * artifact is still running, and the `Pending` slot shows. Unmount it if the call ends without a result.
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
   * How often the shown artifact checks for a newer version, a rename or an access change, in ms
   * (at least 10s). A newer version replaces the one on screen; a deleted or unshared artifact
   * shows an error. Hidden tabs don't check. `false`: never. Default 30s.
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

const noopSubscribe = () => () => {};
const notDeleted = () => false;
const notCached = () => undefined;
/** How long `justEdited` stays true after a newer version replaces the one on screen. */
const EDITED_NOTICE_MS = 10_000;

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
  pollInterval = 30_000,
  children,
  interpreter,
  onError,
  renderContent,
}: ArtifactRendererRootProps) {
  const reference = useMemo(() => parseArtifactReference(response), [response]);
  const id = idProp ?? reference?.id ?? null;
  const ownStorage = content !== undefined;
  // No artifact yet: the tool call that makes it hasn't returned. A response
  // without a reference (even "") is a result, so it's an error instead.
  const isPending = !idProp && response == null && !ownStorage;

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

  const stream = useArtifactStream({
    id,
    version: reference?.version,
    content,
    // Only while the content is shown.
    pollInterval: showsContent && pollInterval,
  });

  // A delete from `useArtifactList` reaches every renderer showing the artifact.
  const storage = useArtifactStorage();
  const cache = storage ? cacheFor(storage) : null;
  const isDeleted = useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    cache && id ? () => cache.isDeleted(id) : notDeleted,
    notDeleted,
  );
  const cached = useSyncExternalStore<ArtifactSummary | undefined>(
    cache?.subscribe ?? noopSubscribe,
    cache && id ? () => cache.get(id) : notCached,
    notCached,
  );

  // A rename or access change the stream picked up reaches the lists. Only changes: on mount,
  // the cache may already be newer than a stream that loaded earlier.
  const { title: streamTitle, isOwner: streamIsOwner, isEditable: streamIsEditable } = stream;
  const streamedRef = useRef({
    id,
    title: streamTitle,
    isOwner: streamIsOwner,
    isEditable: streamIsEditable,
  });
  useEffect(() => {
    const last = streamedRef.current;
    streamedRef.current = {
      id,
      title: streamTitle,
      isOwner: streamIsOwner,
      isEditable: streamIsEditable,
    };
    const current = cache && id ? cache.get(id) : undefined;
    if (!cache || !id || !current || last.id !== id) return;
    const fresh = (key: "title" | "isOwner" | "isEditable", value: unknown) =>
      value !== undefined && value !== last[key] && value !== current[key];
    const patch: Partial<ArtifactSummary> = {
      ...(fresh("title", streamTitle) && { title: streamTitle }),
      ...(fresh("isOwner", streamIsOwner) && { isOwner: streamIsOwner }),
      ...(fresh("isEditable", streamIsEditable) && { isEditable: streamIsEditable }),
    };
    if (Object.keys(patch).length > 0) cache.patch(id, patch);
  }, [cache, id, streamTitle, streamIsOwner, streamIsEditable]);

  // Deleted elsewhere or unshared: it leaves the lists too, until it's shared again.
  const lostAccess = stream.error?.code === "not-found";
  useEffect(() => {
    if (lostAccess && cache && id) cache.evict(id);
  }, [lostAccess, cache, id]);

  // A newer version replaced the one on screen: say so for a while.
  const [justEdited, setJustEdited] = useState(false);
  const shownRef = useRef({ id, version: stream.version });
  useEffect(() => {
    const last = shownRef.current;
    shownRef.current = { id, version: stream.version };
    if (last.id !== id || !last.version || !stream.version || last.version === stream.version) {
      return;
    }
    setJustEdited(true);
    const timer = setTimeout(() => setJustEdited(false), EDITED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [id, stream.version]);

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
  const artifactError = isPending
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

  // ── State for useArtifactRenderer() ──
  const isStreaming = stream.isStreaming;
  const isFetching = inFlight > 0;
  // A rename from useArtifactUpdate reaches the cache before the stream.
  const title = cached?.title ?? streamTitle ?? reference?.title;
  const isOwner = cached?.isOwner ?? streamIsOwner;
  const isEditable = cached?.isEditable ?? streamIsEditable;
  const state = useMemo<ArtifactRendererState>(
    () => ({
      id,
      title,
      isOwner,
      isEditable,
      isPending,
      isStreaming,
      isFetching,
      isLoading: isPending || isStreaming || isFetching,
      justEdited,
      error,
      retry,
      isOpen,
      open,
      close,
      preview,
    }),
    [
      id,
      title,
      isOwner,
      isEditable,
      isPending,
      isStreaming,
      isFetching,
      justEdited,
      error,
      retry,
      isOpen,
      open,
      close,
      preview,
    ],
  );

  const program = isDeleted ? null : stream.program;
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

  // ── Slots and layout ──
  const regions = useMemo(() => extractRegions(children), [children]);
  const chrome = (
    <RegionProvider region="chrome">
      {regions.chrome ?? <Chrome actions={actions} />}
    </RegionProvider>
  );

  return (
    <RendererStateContext.Provider value={state}>
      <ContentConfigContext.Provider value={contentConfig}>
        <div className={clsx(styles.root, names.root, className)}>
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
    </RendererStateContext.Provider>
  );
}

/** The slots every renderer carries, such as `LiveArtifactRenderer.Preview`. */
export const slots = {
  Preview,
  PreviewTitle,
  PreviewDescription,
  PreviewLoader,
  Chrome,
  ChromeTitle,
  ChromeLoader,
  ChromeActions,
  EditedNotice,
  CloseButton,
  Content,
  Pending,
  Loading,
  Error: ErrorSlot,
};
