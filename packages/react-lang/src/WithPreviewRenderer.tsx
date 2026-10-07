import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from "react";
import { Renderer, type RendererProps } from "./Renderer";
import { parseResponseBundle, type ResponseMetadata } from "./responseBundle";

export interface RendererPreviewState {
  metadata: ResponseMetadata;
  isOpen: boolean;
  isStreaming: boolean;
  /** ID of the expanded content region. */
  contentId: string;
  open: () => void;
  close: () => void;
}

export interface WithPreviewRendererProps extends RendererProps {
  /** Controlled visibility. Omit to use internal state. */
  open?: boolean;
  /** Initial visibility when uncontrolled. Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Metadata belongs to the preview presentation, not the underlying Renderer. */
  onMetadata?: (metadata: ResponseMetadata) => void;
  /** Compose Trigger, Content, and Close. Omit for the default preview and panel. */
  children?: React.ReactNode;
}

const PreviewContext = createContext<{
  state: RendererPreviewState;
  rendererProps: RendererProps;
} | null>(null);

function usePreviewContext() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error(
      "Preview slots must be used within WithPreviewRenderer.Root or WithPreviewRenderer.",
    );
  }
  return context;
}

/** Read metadata and control the nearest preview. Available even while its content is closed. */
export function useRendererPreview(): RendererPreviewState {
  return usePreviewContext().state;
}

function PreviewRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onMetadata,
  children,
  ...rendererProps
}: WithPreviewRendererProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;
  const isStreaming = rendererProps.isStreaming === true;
  const contentId = useId();
  const bundle = useMemo(
    () => parseResponseBundle(rendererProps.response, isStreaming),
    [rendererProps.response, isStreaming],
  );
  const metadataName = bundle.metadata.name;
  const metadata = useMemo<ResponseMetadata>(
    () => (metadataName === undefined ? {} : { name: metadataName }),
    [metadataName],
  );
  const metadataCallback = useRef(onMetadata);
  metadataCallback.current = onMetadata;
  useEffect(() => {
    metadataCallback.current?.(metadata);
  }, [metadata]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next === isOpen) return;
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, isOpen, onOpenChange],
  );
  const open = useCallback(() => setOpen(true), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const state = useMemo(
    () => ({ metadata, isOpen, isStreaming, contentId, open, close }),
    [metadata, isOpen, isStreaming, contentId, open, close],
  );

  return (
    <PreviewContext.Provider value={{ state, rendererProps }}>{children}</PreviewContext.Provider>
  );
}

export type PreviewButtonProps = ComponentPropsWithRef<"button">;

function PreviewTrigger({ children, onClick, disabled, ...props }: PreviewButtonProps) {
  const { metadata, isOpen, isStreaming, contentId, open, close } = useRendererPreview();
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      aria-expanded={isOpen}
      aria-controls={isOpen ? contentId : undefined}
      onClick={(event) => {
        if (disabled || event.defaultPrevented) return;
        onClick?.(event);
        if (!event.defaultPrevented) (isOpen ? close : open)();
      }}
    >
      {children === undefined
        ? `${metadata.name || "Untitled artifact"}${isStreaming ? " (generating…)" : ""}`
        : children}
    </button>
  );
}

function PreviewClose({ children, onClick, disabled, ...props }: PreviewButtonProps) {
  const { metadata, close } = useRendererPreview();
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      onClick={(event) => {
        if (disabled || event.defaultPrevented) return;
        onClick?.(event);
        if (!event.defaultPrevented) close();
      }}
    >
      {children === undefined ? `Close ${metadata.name || "Untitled artifact"}` : children}
    </button>
  );
}

export type PreviewContentProps = ComponentPropsWithRef<"section">;

/** Mount one content slot per preview. Query hooks and Renderer slots belong inside it. */
function PreviewContent({ children, style, ...props }: PreviewContentProps) {
  const { state, rendererProps } = usePreviewContext();
  if (!state.isOpen) return null;
  return (
    <section
      aria-label={state.metadata.name || "Untitled artifact"}
      {...props}
      id={state.contentId}
      style={{ position: "relative", ...style }}
    >
      {children === undefined ? (
        <>
          <PreviewClose />
          <Renderer {...rendererProps} />
        </>
      ) : (
        <Renderer {...rendererProps}>{children}</Renderer>
      )}
    </section>
  );
}

function DefaultWithPreviewRenderer({ children, ...props }: WithPreviewRendererProps) {
  return (
    <PreviewRoot {...props}>
      {children === undefined ? (
        <>
          <PreviewTrigger />
          <PreviewContent />
        </>
      ) : (
        children
      )}
    </PreviewRoot>
  );
}

/** Adds a preview and expandable content. Use Renderer for a directly visible interface. */
export const WithPreviewRenderer = Object.assign(DefaultWithPreviewRenderer, {
  Root: PreviewRoot,
  Trigger: PreviewTrigger,
  Content: PreviewContent,
  Close: PreviewClose,
});
