"use client";

import {
  defineArtifactRenderer,
  type ArtifactRendererConfig,
  type Interpreter,
} from "@openuidev/react-headless";
import type { Library } from "@openuidev/react-lang";
import clsx from "clsx";
import type { ReactNode } from "react";
import { parseArtifactReference } from "./artifactReference";
import { LiveArtifactRenderer } from "./ArtifactRenderer";
import { names, styles } from "./cloudArtifact.styles";

export interface DashboardRendererOptions<L extends Library = Library> {
  /** The tool or tools that create and edit dashboards, such as `["create_dashboard", "edit_dashboard"]`. */
  toolName: string | string[];
  /** The component library the dashboards are built from. */
  library: L;
  /** Where the dashboards' data tools run: your endpoint (`{ url }`) or an async function. */
  interpreter: Interpreter;
  /** Shown on the artifact browser's cards and in the workspace. Defaults to `"Dashboard"`. */
  label?: string;
  /** The icon for dashboards in the artifact nav. */
  icon?: ReactNode;
}

/** What the renderer streams: a tool's result, or a saved dashboard's id. */
export interface DashboardRendererProps {
  response?: string;
  id?: string;
}

/** OpenUI Cloud's dashboards are stored with this type. */
const DASHBOARD_TYPE = "dashboard";

/**
 * A version is `<epoch ms>-<suffix>`, so its number grows with every edit: AgentInterface
 * moves an open panel to the newer one.
 */
const versionNumber = (version: string | undefined) => Number.parseInt(version ?? "", 10) || 0;

/**
 * An artifact renderer for OpenUI Cloud dashboards, for `AgentInterface`'s `artifactRenderers`.
 * The dashboard tools' results show as a card in the chat that opens the dashboard in the side
 * panel, streaming as it's generated, with live data through `interpreter`. Saved dashboards open
 * in the artifact browser by their id. Needs an `OpenUICloudProvider` above it.
 *
 * @category Functions
 *
 * @example
 * ```tsx
 * const dashboards = defineDashboardRenderer({
 *   toolName: ["create_dashboard", "edit_dashboard"],
 *   library,
 *   interpreter: { url: "/api/interpreter" },
 * });
 *
 * <OpenUICloudProvider token="/api/frontend-token">
 *   <AgentInterface artifactRenderers={[dashboards]} … />
 * </OpenUICloudProvider>
 * ```
 */
export function defineDashboardRenderer<L extends Library>({
  toolName,
  library,
  interpreter,
  label = "Dashboard",
  icon,
}: DashboardRendererOptions<L>): ArtifactRendererConfig<DashboardRendererProps> {
  return defineArtifactRenderer<DashboardRendererProps>({
    type: DASHBOARD_TYPE,
    toolName,
    label,
    icon,
    parser: ({ response, id }) => {
      // The artifact browser opens a saved dashboard by its id; its content isn't a tool result.
      if (id) return { props: { id }, meta: { id, version: 0, heading: label } };
      // Nothing until the tool returns. A result without a dashboard (the tool failed) still
      // renders, so the renderer can say why.
      if (typeof response !== "string" || !response) return null;
      const reference = parseArtifactReference(response);
      return {
        props: { response },
        meta: reference && {
          id: reference.id,
          version: versionNumber(reference.version),
          heading: reference.title || label,
        },
      };
    },
    // The card only: the dashboard opens in AgentInterface's side panel, not under it.
    preview: (props, controls) => (
      <LiveArtifactRenderer
        {...props}
        library={library}
        interpreter={interpreter}
        isOpen={controls.isActive}
        onOpenChange={(open) => (open ? controls.open() : controls.close())}
        renderInHtmlElement={null}
      />
    ),
    actual: (props) => (
      <LiveArtifactRenderer
        {...props}
        library={library}
        interpreter={interpreter}
        preview={false}
        className={clsx(names.panel, styles.panel)}
      />
    ),
  });
}
