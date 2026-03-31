"use client";

import { useArtifact } from "@openuidev/react-headless";
import { defineComponent, type ComponentRenderer } from "@openuidev/react-lang";
import { useId, type ReactNode } from "react";
import { z } from "zod";
import { ArtifactPanel, type ArtifactPanelProps } from "../components/_shared/artifact";

/**
 * Controls passed to `preview` and `panel` render functions.
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
  /** The auto-generated artifact ID. */
  artifactId: string;
}

/**
 * Configuration for {@link defineArtifact}.
 */
export interface DefineArtifactConfig<T extends z.ZodObject<any>> {
  /** Component name (used in the library and prompt generation). */
  name: string;
  /** Zod schema for the component props. */
  props: T;
  /** Description shown in the generated prompt. */
  description: string;
  /** Panel title — static string or derived from props. */
  title: string | ((props: z.infer<T>) => string);
  /** Renders the inline preview shown in the chat message. */
  preview: (props: z.infer<T>, controls: ArtifactControls) => ReactNode;
  /** Renders the content inside the artifact side panel. */
  panel: (props: z.infer<T>, controls: ArtifactControls) => ReactNode;
  /** Optional props forwarded to the underlying `<ArtifactPanel>`. */
  panelProps?: Pick<ArtifactPanelProps, "className" | "errorFallback" | "header">;
}

/**
 * Define an artifact component that automatically wires `useId`, `useArtifact`,
 * and `<ArtifactPanel>`. Returns a standard `DefinedComponent` compatible with
 * `createLibrary()` and `<Renderer>`.
 *
 * @example
 * ```tsx
 * export const ArtifactCodeBlock = defineArtifact({
 *   name: "ArtifactCodeBlock",
 *   props: ArtifactCodeBlockSchema,
 *   description: "Code block that opens in the artifact side panel",
 *   title: (props) => props.title,
 *   preview: (props, { open, isActive }) => (
 *     <InlinePreview title={props.title} onOpen={open} isActive={isActive} />
 *   ),
 *   panel: (props) => (
 *     <ArtifactView language={props.language} codeString={props.codeString} />
 *   ),
 * });
 * ```
 */
export function defineArtifact<T extends z.ZodObject<any>>(config: DefineArtifactConfig<T>) {
  const { name, props, description, title, preview, panel, panelProps } = config;

  const component: ComponentRenderer<z.infer<T>> = ({ props: componentProps }) => {
    const artifactId = useId();
    const { isActive, open, close, toggle } = useArtifact(artifactId);

    const controls: ArtifactControls = { isActive, open, close, toggle, artifactId };
    const resolvedTitle = typeof title === "function" ? title(componentProps) : title;

    return (
      <>
        {preview(componentProps, controls)}
        <ArtifactPanel artifactId={artifactId} title={resolvedTitle} {...panelProps}>
          {panel(componentProps, controls)}
        </ArtifactPanel>
      </>
    );
  };

  return defineComponent({
    name,
    props,
    description,
    component,
    artifact: { enabled: true },
  });
}
