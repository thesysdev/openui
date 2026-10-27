"use client";

import { useCallback, type ReactNode } from "react";
import {
  ArtifactRendererRoot,
  slots,
  type ArtifactRendererBaseProps,
  type RenderContentArgs,
} from "./ArtifactRendererRoot";

export interface CreateArtifactRendererOptions {
  /** Shown in React DevTools. */
  displayName?: string;
}

/**
 * Builds an artifact renderer around your own viewer, such as for slides or
 * reports. It gets the same props, modes, slots and `useArtifactRenderer()` as
 * `LiveArtifactRenderer`; you draw only the artifact itself.
 *
 * ```tsx
 * export const SlidesRenderer = createArtifactRenderer(({ program, isStreaming }) => (
 *   <Presentation response={program} isStreaming={isStreaming} />
 * ));
 * ```
 *
 * Props beyond the shared ones are passed to `render` as its second argument.
 *
 * @category Functions
 */
export function createArtifactRenderer<ExtraProps extends object = Record<never, never>>(
  render: (args: RenderContentArgs, props: ExtraProps) => ReactNode,
  options: CreateArtifactRendererOptions = {},
) {
  function ArtifactRenderer({
    response,
    id,
    content,
    preview,
    renderInHtmlElement,
    isOpen,
    onOpenChange,
    defaultOpen,
    className,
    onError,
    children,
    ...extra
  }: ArtifactRendererBaseProps & ExtraProps) {
    // `extra` is a new object every render, so this re-renders the artifact
    // whenever the renderer does, which is what a parent passing new props wants.
    const renderContent = useCallback(
      (args: RenderContentArgs) => render(args, extra as unknown as ExtraProps),
      [extra],
    );
    return (
      <ArtifactRendererRoot
        response={response}
        id={id}
        content={content}
        preview={preview}
        renderInHtmlElement={renderInHtmlElement}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        defaultOpen={defaultOpen}
        className={className}
        onError={onError}
        renderContent={renderContent}
      >
        {children}
      </ArtifactRendererRoot>
    );
  }
  ArtifactRenderer.displayName = options.displayName ?? "ArtifactRenderer";
  return Object.assign(ArtifactRenderer, slots);
}
