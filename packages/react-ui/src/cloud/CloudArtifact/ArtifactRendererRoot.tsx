"use client";

import {
  createInterpreterToolProvider,
  useArtifactStorage,
  useArtifactStream,
  type Interpreter,
  type InterpreterToolProvider,
} from "@openuidev/react-headless";
import type { McpClientLike, OpenUIError } from "@openuidev/react-lang";
import clsx from "clsx";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  Error as ErrorSlot,
  Loading,
  Preview,
  PreviewDescription,
  PreviewLoader,
  PreviewTitle,
  RegionProvider,
} from "./slots";

/** Props every artifact renderer takes. */
export interface ArtifactRendererBaseProps {
  /** The tool's result, unchanged. The renderer reads the artifact from it. */
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

type ToolResult = Awaited<ReturnType<InterpreterToolProvider["callTool"]>>;
type QueryResults = { version?: string; results: Record<string, unknown> };
const noStored = () => null;

/** The same key for the same tool and arguments, whatever the order of the argument keys. */
function queryKey(tool: string, args: unknown): string {
  const sorted = (_key: string, value: unknown) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)))
      : value;
  return `${tool}::${JSON.stringify(args ?? {}, sorted)}`;
}

/** `stored` if it is here before `real` settles, else `real`: the real call never waits. */
async function firstOf(
  real: Promise<ToolResult>,
  stored: Promise<ToolResult | null>,
  onStored: () => void,
): Promise<ToolResult> {
  const found = await Promise.race([real.then(noStored, noStored), stored]);
  if (!found) return real;
  onStored();
  return found;
}

/** One artifact version on screen. Its first batch of data calls may be answered from the stored results. */
function newRun(id: string, version: string | undefined, stored: Promise<QueryResults>) {
  return {
    id,
    version,
    stored,
    /** True until every call of the first batch has settled. */
    open: true,
    asked: new Set<string>(),
    /** The first batch's real calls, answered once more when the queries run again. */
    fetched: new Map<string, Promise<ToolResult>>(),
    pending: 0,
    /** The first batch's results, to store. */
    results: {} as Record<string, unknown>,
    showedStored: false,
  };
}
type Run = ReturnType<typeof newRun>;

const noopSubscribe = () => () => {};
const notDeleted = () => false;
const noTitle = () => undefined;

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
  children,
  interpreter,
  onError,
  renderContent,
}: ArtifactRendererRootProps) {
  const reference = useMemo(() => parseArtifactReference(response), [response]);
  const id = idProp ?? reference?.id ?? null;
  const ownStorage = content !== undefined;
  const stream = useArtifactStream({ id, version: reference?.version, content });

  // A delete from `useArtifactList` reaches every renderer showing the artifact.
  const storage = useArtifactStorage();
  const cache = storage ? cacheFor(storage) : null;
  const isDeleted = useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    cache && id ? () => cache.isDeleted(id) : notDeleted,
    notDeleted,
  );
  const cachedTitle = useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    cache && id ? () => cache.get(id)?.title : noTitle,
    noTitle,
  );

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
  const artifactError = !id && !ownStorage ? NO_ID_ERROR : isDeleted ? DELETED_ERROR : stream.error;
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

  // ── Last results: a reopened dashboard shows them while its queries run ──
  // `Renderer` runs its queries again only for a new provider, so the refresh takes
  // the provider away for one render.
  const [refreshing, setRefreshing] = useState(false);
  useLayoutEffect(() => {
    if (refreshing) setRefreshing(false);
  }, [refreshing]);
  const runRef = useRef<Run | null>(null);
  // The queries have run again (a child's effects run first): what they did not ask for is dropped.
  useEffect(() => {
    if (!refreshing) runRef.current?.fetched.clear();
  }, [refreshing]);
  // Content shown again later starts over, with real calls.
  const showsContent = !preview || (isOpen && renderInHtmlElement !== null);
  useEffect(
    () => () => {
      runRef.current = null;
    },
    [showsContent],
  );
  const storageRef = useRef(storage);
  storageRef.current = storage;

  const lastResultsProvider = useMemo<InterpreterToolProvider>(() => {
    // Read on a run's first call, so a card that shows no content never reads.
    const currentRun = (): Run | null => {
      const { id: artifactId, version } = requestRef.current;
      const store = storageRef.current;
      if (!artifactId || !store?.getQueryResults) return null;
      const run = runRef.current;
      if (run?.id === artifactId && run.version === version) return run;
      const stored = store.getQueryResults(artifactId).catch((): QueryResults => ({ results: {} }));
      return (runRef.current = newRun(artifactId, version, stored));
    };
    const storedResult = async (run: Run, key: string): Promise<ToolResult | null> => {
      const { version, results } = await run.stored;
      if (!run.version || version !== run.version || !Object.hasOwn(results, key)) return null;
      return { content: [], structuredContent: results[key] };
    };
    // The version is the one every call of the run was made with, also during an edit.
    const saveSnapshot = (run: Run) => {
      if (!run.version || Object.keys(run.results).length === 0) return;
      const snapshot = { version: run.version, results: run.results };
      if (JSON.stringify(snapshot).length > 1024 * 1024) return;
      storageRef.current?.putQueryResults?.(run.id, snapshot);
    };
    const closeRun = (run: Run) => {
      run.open = false;
      if (run !== runRef.current) return;
      saveSnapshot(run);
      if (run.showedStored) setRefreshing(true);
      else run.fetched.clear();
    };
    return {
      callTool(params) {
        const run = currentRun();
        if (!run) return toolProvider.callTool(params);
        const key = queryKey(params.name, params.arguments);
        const fetched = run.open ? undefined : run.fetched.get(key);
        if (fetched) {
          run.fetched.delete(key);
          return fetched;
        }
        const real = toolProvider.callTool(params);
        // After the first batch, and for a repeated call, exactly as without stored results.
        if (!run.open || run.asked.has(key)) return real;
        run.asked.add(key);
        run.fetched.set(key, real);
        run.pending++;
        const keep = (result: ToolResult) => void (run.results[key] = result.structuredContent);
        void real.then(keep, () => {}).then(() => --run.pending === 0 && closeRun(run));
        return firstOf(real, storedResult(run, key), () => (run.showedStored = true));
      },
    };
  }, [toolProvider]);
  const dataProvider = storage?.getQueryResults ? lastResultsProvider : toolProvider;

  // ── State for useArtifactRenderer() ──
  const isStreaming = stream.isStreaming;
  const isFetching = inFlight > 0;
  // A rename from useArtifactUpdate reaches the cache before the stream.
  const title = cachedTitle ?? stream.title ?? reference?.title;
  const state = useMemo<ArtifactRendererState>(
    () => ({
      id,
      title,
      isStreaming,
      isFetching,
      isLoading: isStreaming || isFetching,
      error,
      retry,
      isOpen,
      open,
      close,
      preview,
    }),
    [id, title, isStreaming, isFetching, error, retry, isOpen, open, close, preview],
  );

  const program = isDeleted ? null : stream.program;
  const contentConfig = useMemo<ContentConfig>(
    () => ({
      isEmpty: !program,
      render: () =>
        renderContent({
          program,
          isStreaming,
          toolProvider: interpreter && !refreshing ? dataProvider : undefined,
          rendererKey,
          onError: handleRendererErrors,
        }),
    }),
    [
      program,
      isStreaming,
      interpreter,
      refreshing,
      dataProvider,
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
  CloseButton,
  Content,
  Loading,
  Error: ErrorSlot,
};
