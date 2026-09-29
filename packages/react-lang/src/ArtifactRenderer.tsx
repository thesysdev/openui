import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Renderer, type RendererProps } from "./Renderer";
import { parseResponseBundle, type ResponseMetadata } from "./responseBundle";

export interface ArtifactPreviewProps {
  metadata: ResponseMetadata;
  isOpen: boolean;
  isStreaming: boolean;
  /** ID for the default content region, also usable by a custom presentation. */
  contentId: string;
  open: () => void;
  close: () => void;
}

export interface ArtifactContentProps extends ArtifactPreviewProps {
  children: ReactNode;
}

export interface ArtifactRendererProps extends RendererProps {
  /** Controlled visibility. Omit to use internal state. */
  open?: boolean;
  /** Initial visibility when uncontrolled. Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Metadata belongs to the artifact presentation, not the underlying Renderer. */
  onMetadata?: (metadata: ResponseMetadata) => void;
  /** Customize the inline preview/trigger. Return null to hide it. */
  renderPreview?: (props: ArtifactPreviewProps) => ReactNode;
  /**
   * Customize the expanded content. Called only while open.
   * Return a panel, dialog, or a host-created portal containing children.
   * The host owns portal targets, focus management, and dialog accessibility.
   */
  renderArtifact?: (props: ArtifactContentProps) => ReactNode;
}

/** A minimal artifact presentation pattern around the standalone Renderer. */
export function ArtifactRenderer({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onMetadata,
  renderPreview,
  renderArtifact,
  ...rendererProps
}: ArtifactRendererProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;
  const isStreaming = rendererProps.isStreaming === true;
  const contentId = useId();
  const bundle = useMemo(
    () => parseResponseBundle(rendererProps.response, isStreaming),
    [rendererProps.response, isStreaming],
  );
  const metadata = useMemo<ResponseMetadata>(
    () => ({ ...bundle.metadata }),
    [bundle.metadata.name],
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
  const previewProps: ArtifactPreviewProps = {
    metadata,
    isOpen,
    isStreaming,
    contentId,
    open,
    close,
  };
  const name = metadata.name || "Untitled artifact";
  const children = isOpen ? <Renderer {...rendererProps} /> : null;

  return (
    <>
      {renderPreview ? (
        renderPreview(previewProps)
      ) : (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={isOpen ? contentId : undefined}
          onClick={isOpen ? close : open}
        >
          {name}
          {isStreaming ? " (generating…)" : ""}
        </button>
      )}
      {isOpen &&
        (renderArtifact ? (
          renderArtifact({ ...previewProps, children })
        ) : (
          <section id={contentId} aria-label={name}>
            <button type="button" onClick={close}>
              Close {name}
            </button>
            {children}
          </section>
        ))}
    </>
  );
}
