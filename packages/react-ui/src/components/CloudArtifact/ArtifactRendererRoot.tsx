"use client";

import {
  createInterpreterToolProvider,
  parseArtifactReference,
  useArtifactStream,
  type Interpreter,
} from "@openuidev/react-headless";
import type { McpClientLike, OpenUIError } from "@openuidev/react-lang";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { RendererStateContext, type ArtifactRendererState } from "./contexts";
import { toolError, type ArtifactError } from "./errors";
import { Chrome, Content, Preview } from "./parts";

/** Props every artifact renderer takes. */
export interface ArtifactRendererBaseProps {
  /** The tool's result, unchanged. The renderer reads the artifact from it. */
  response?: string | null;
  /** Instead of `response`, the artifact's id. */
  id?: string;
  /** The artifact's saved content, if you keep artifacts in your own storage. */
  content?: string;
  /** `true` (default): a preview card that opens the artifact. `false`: standalone, inline. */
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
  /** Buttons in the open artifact's bar, next to its close button, such as "Edit". */
  actions?: ReactNode;
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

/** The shared renderer: streaming, live data, errors, open state and layout. */
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
  interpreter,
  onError,
  renderContent,
}: ArtifactRendererRootProps) {
  const reference = useMemo(() => parseArtifactReference(response), [response]);
  const id = idProp ?? reference?.id ?? null;
  const ownStorage = content !== undefined;
  const stream = useArtifactStream({ id, version: reference?.version, content });

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
  // The artifact's own error is the stream's, as is, so it keeps its identity
  // across renders. It wins over a failed data tool.
  const artifactError = !id && !ownStorage ? NO_ID_ERROR : stream.error;
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

  // ── State for useArtifactRenderer() ──
  const isStreaming = stream.isStreaming;
  const isFetching = inFlight > 0;
  const title = stream.title ?? reference?.title;
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

  const program = stream.program;
  const body = (
    <Content isEmpty={!program}>
      {renderContent({
        program,
        isStreaming,
        toolProvider: interpreter ? toolProvider : undefined,
        rendererKey,
        onError: handleRendererErrors,
      })}
    </Content>
  );
  const chrome = <Chrome actions={actions}>{body}</Chrome>;

  return (
    <RendererStateContext.Provider value={state}>
      <div className={clsx("openui-artifact", className)}>
        {preview ? (
          <>
            <Preview />
            {/* `null`: your element isn't mounted yet (a ref callback hasn't run). */}
            {isOpen &&
              renderInHtmlElement !== null &&
              (renderInHtmlElement ? createPortal(chrome, renderInHtmlElement) : chrome)}
          </>
        ) : (
          body
        )}
      </div>
    </RendererStateContext.Provider>
  );
}
