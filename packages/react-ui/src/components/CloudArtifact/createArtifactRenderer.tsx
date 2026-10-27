"use client";

import type { ReactNode } from "react";
import {
  ArtifactRendererRoot,
  slots,
  type ArtifactRendererBaseProps,
  type RenderContentArgs,
} from "./ArtifactRendererRoot";

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
 * @category Functions
 */
export function createArtifactRenderer(
  render: (args: RenderContentArgs) => ReactNode,
  displayName = "ArtifactRenderer",
) {
  function ArtifactRenderer(props: ArtifactRendererBaseProps) {
    return <ArtifactRendererRoot {...props} renderContent={render} />;
  }
  ArtifactRenderer.displayName = displayName;
  return Object.assign(ArtifactRenderer, slots);
}
