"use client";

import {
  createInterpreterToolProvider,
  parseArtifactReference,
  useArtifactStorage,
  useArtifactStream,
  type Interpreter,
} from "@openuidev/react-headless";
import type { McpClientLike, OpenUIError } from "@openuidev/react-lang";
import clsx from "clsx";
import {
  Children,
  Fragment,
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
import { cacheFor } from "./artifactCache";
import {
  ContentConfigContext,
  RendererStateContext,
  type ArtifactRendererState,
  type ContentConfig,
} from "./contexts";
import { artifactError, toolError, type ArtifactError } from "./errors";
import { OpenSurface } from "./overlay";
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
  warnOnce,
} from "./slots";

/** Props every artifact renderer takes. */
export interface ArtifactRendererBaseProps {
  /** The tool's result, unchanged. The renderer reads the artifact from it. */
  response?: string | null;
  /** Instead of `response`, the artifact's id, such as from `useArtifactList`. */
  id?: string;
  /** The artifact's saved content, if you keep artifacts in your own storage. */
  content?: string;
  /** `true` (default): a preview card that opens the artifact. `false`: standalone, inline. */
  preview?: boolean;
  /** The element the artifact opens in. Omit for a fullscreen overlay. */
  renderInHtmlElement?: HTMLElement | null;
  /** Controlled open state. Without it, the renderer manages it. */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Start open, when the renderer manages the open state. */
  defaultOpen?: boolean;
  /** Added to the artifact's root element. */
  className?: string;
  /** Receives the artifact's errors, with `Renderer`'s own. */
  onError?: (errors: OpenUIError[]) => void;
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

const NO_ID_ERROR = artifactError("not-found", "This response doesn’t reference an artifact.");
const DELETED_ERROR = artifactError("not-found", "This artifact was deleted.");

/** Top-level children: only the `Preview` and `Chrome` regions count. */
function extractRegions(children: ReactNode) {
  let preview: ReactElement | undefined;
  let chrome: ReactElement | undefined;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Preview) {
      if (preview) warnOnce("regions:preview", "Only the first <Preview> slot is used.");
      else preview = child;
    } else if (child.type === Chrome) {
      if (chrome) warnOnce("regions:chrome", "Only the first <Chrome> slot is used.");
      else chrome = child;
    } else {
      warnOnce(
        "regions:other",
        "Only <Preview> and <Chrome> go at the top level of an artifact renderer; other children are ignored.",
      );
    }
  });
  return { preview, chrome };
}

/**
 * Standalone mode shows only the chrome's `Content`. Look for it through plain
 * elements and fragments; a `Content` inside your own component can't be seen
 * from here, so the default `Content` is used then.
 */
function findContent(node: ReactNode): ReactElement | null {
  let found: ReactElement | null = null;
  Children.forEach(node, (child) => {
    if (found || !isValidElement(child)) return;
    if (child.type === Content) {
      found = child;
    } else if (typeof child.type === "string" || child.type === Fragment || child.type === Chrome) {
      found = findContent((child.props as { children?: ReactNode }).children);
    }
  });
  return found;
}

const noopSubscribe = () => () => {};
const notDeleted = () => false;

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
  children,
  interpreter,
  onError,
  renderContent,
}: ArtifactRendererRootProps) {
  const reference = useMemo(() => parseArtifactReference(response), [response]);
  const id = idProp ?? reference?.id ?? null;
  const ownStorage = content !== undefined;
  const stream = useArtifactStream({ id, version: reference?.version, content });

  useEffect(() => {
    if (!id) {
      warnOnce(
        "no-id",
        "An artifact renderer got neither an `id` nor a `response` with an artifact in it.",
      );
    }
  }, [id]);

  // A delete from `useArtifactList` reaches every renderer showing the artifact.
  const storage = useArtifactStorage();
  const cache = storage ? cacheFor(storage) : null;
  const isDeleted = useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    cache && id ? () => cache.isDeleted(id) : notDeleted,
    notDeleted,
  );
  const summary = cache && id ? cache.get(id) : undefined;

  // ── Live data: in-flight calls and failures, from the interpreter ──
  const [inFlight, setInFlight] = useState(0);
  const [toolErrors, setToolErrors] = useState<Record<string, string>>({});
  const [rendererKey, setRendererKey] = useState(0);
  const interpreterRef = useRef(interpreter);
  interpreterRef.current = interpreter;
  const requestRef = useRef<{ id: string | null; response?: string }>({ id });
  requestRef.current = { id, response: content };

  const toolProvider = useMemo(
    () =>
      createInterpreterToolProvider({
        getInterpreter: () => interpreterRef.current,
        getRequest: () => requestRef.current,
        onStart: () => setInFlight((count) => count + 1),
        onSettle: (toolName, message) => {
          setInFlight((count) => Math.max(0, count - 1));
          setToolErrors((current) => {
            if (message === null) {
              if (!(toolName in current)) return current;
              const { [toolName]: _cleared, ...rest } = current;
              return rest;
            }
            return current[toolName] === message ? current : { ...current, [toolName]: message };
          });
        },
      }),
    [],
  );

  // ── Errors and retry ──
  const [failedTool, failedMessage] = Object.entries(toolErrors)[0] ?? [];
  const streamError = stream.error;
  const error = useMemo<ArtifactError | null>(() => {
    if (!id && !ownStorage) return NO_ID_ERROR;
    if (isDeleted) return DELETED_ERROR;
    if (streamError) return artifactError(streamError.code, streamError.message);
    return failedTool && failedMessage ? toolError(failedTool, failedMessage) : null;
  }, [id, ownStorage, isDeleted, streamError, failedTool, failedMessage]);

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
  const artifactErrorsRef = useRef<OpenUIError[]>([]);
  const handleRendererErrors = useCallback((errors: OpenUIError[]) => {
    rendererErrorsRef.current = errors;
    onErrorRef.current?.([...artifactErrorsRef.current, ...errors]);
  }, []);
  const reportedErrorRef = useRef<ArtifactError | null>(null);
  // Only artifact-level errors are added: `Renderer` already reports failed
  // data tools to `onError` itself.
  const artifactLevelError = error?.source === "artifact" ? error : null;
  useEffect(() => {
    artifactErrorsRef.current = artifactLevelError ? [artifactLevelError] : [];
    if (artifactLevelError === reportedErrorRef.current) return;
    reportedErrorRef.current = artifactLevelError;
    onErrorRef.current?.([...artifactErrorsRef.current, ...rendererErrorsRef.current]);
  }, [artifactLevelError]);

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

  // ── State for useArtifactRenderer() ──
  const isStreaming = stream.isStreaming;
  const isFetching = inFlight > 0;
  const title = stream.title ?? reference?.title ?? summary?.title;
  const description = stream.description ?? summary?.description;
  const state = useMemo<ArtifactRendererState>(
    () => ({
      id,
      title,
      description,
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
    [id, title, description, isStreaming, isFetching, error, retry, isOpen, open, close, preview],
  );

  const program = isDeleted ? null : stream.program;
  const contentConfig = useMemo<ContentConfig>(
    () => ({
      isEmpty: !program,
      render: () =>
        renderContent({
          program,
          isStreaming,
          toolProvider: interpreter ? toolProvider : undefined,
          rendererKey,
          onError: handleRendererErrors,
        }),
    }),
    [
      program,
      isStreaming,
      interpreter,
      toolProvider,
      rendererKey,
      handleRendererErrors,
      renderContent,
    ],
  );

  // ── Slots and layout ──
  const regions = useMemo(() => extractRegions(children), [children]);
  const chrome = <RegionProvider region="chrome">{regions.chrome ?? <Chrome />}</RegionProvider>;

  return (
    <RendererStateContext.Provider value={state}>
      <ContentConfigContext.Provider value={contentConfig}>
        <div className={clsx("openui-artifact", className)}>
          {preview ? (
            <>
              <RegionProvider region="preview">{regions.preview ?? <Preview />}</RegionProvider>
              {isOpen && (
                <OpenSurface
                  target={renderInHtmlElement}
                  label={title ?? "Artifact"}
                  onClose={close}
                >
                  {chrome}
                </OpenSurface>
              )}
            </>
          ) : (
            <RegionProvider region="chrome">
              {findContent(regions.chrome) ?? <Content />}
            </RegionProvider>
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
