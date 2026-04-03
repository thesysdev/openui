"use client";

import { useArtifact } from "@openuidev/react-headless";
import type { ComponentRenderer } from "@openuidev/react-lang";
import { useId, type ReactNode } from "react";
import { ArtifactPanel, type ArtifactPanelProps } from "../components/_shared/artifact";

/**
 * Controls injected into `preview` and `panel` render functions.
 */
export interface ArtifactControls {
  /** Whether this artifact is the currently active (visible) one. */
  isActive: boolean;
  /** Activates this artifact. */
  open: () => void;
  /** Deactivates this artifact. */
  close: () => void;
  /** Toggles this artifact: opens if closed, closes if open. */
  toggle: () => void;
}

/**
 * Configuration for {@link Artifact}.
 */
export interface ArtifactConfig<P = Record<string, unknown>> {
  /** Panel title — static string or derived from props. */
  title: string | ((props: P) => string);
  /** Renders the inline preview shown in the chat message. */
  preview: (props: P, controls: ArtifactControls) => ReactNode;
  /** Renders the content inside the artifact side panel. */
  panel: (props: P, controls: ArtifactControls) => ReactNode;
  /** Optional props forwarded to the underlying `<ArtifactPanel>`. */
  panelProps?: Pick<ArtifactPanelProps, "className" | "errorFallback" | "header">;
}

/**
 * Factory that returns a `ComponentRenderer<P>` wiring up `useId`, `useArtifact`,
 * and `<ArtifactPanel>` internally. Pass the result as `defineComponent`'s `component`.
 *
 * @example
 * ```tsx
 * export const ArtifactCodeBlock = defineComponent({
 *   name: "ArtifactCodeBlock",
 *   props: ArtifactCodeBlockSchema,
 *   description: "Code block that opens in the artifact side panel",
 *   component: Artifact({
 *     title: (props) => props.title,
 *     preview: (props, { open, isActive }) => (
 *       <InlinePreview title={props.title} onOpen={open} isActive={isActive} />
 *     ),
 *     panel: (props) => (
 *       <ArtifactView language={props.language} codeString={props.codeString} />
 *     ),
 *   }),
 * });
 * ```
 */
export function Artifact<P = Record<string, unknown>>(
  config: ArtifactConfig<P>,
): ComponentRenderer<P> {
  const { title, preview, panel, panelProps } = config;

  const ArtifactComponent: ComponentRenderer<P> = ({ props }) => {
    const artifactId = useId();
    const { isActive, open, close, toggle } = useArtifact(artifactId);

    const controls: ArtifactControls = { isActive, open, close, toggle };
    const resolvedTitle = typeof title === "function" ? title(props) : title;

    return (
      <>
        {preview(props, controls)}
        <ArtifactPanel artifactId={artifactId} title={resolvedTitle} {...panelProps}>
          {panel(props, controls)}
        </ArtifactPanel>
      </>
    );
  };

  ArtifactComponent.displayName = `Artifact(${typeof title === "string" ? title : "dynamic"})`;

  return ArtifactComponent;
}
