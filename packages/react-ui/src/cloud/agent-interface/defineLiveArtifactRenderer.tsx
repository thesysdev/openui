"use client";

import {
  defineArtifactRenderer,
  type ArtifactRendererConfig,
  type Interpreter,
} from "@openuidev/react-headless";
import type { Library } from "@openuidev/react-lang";
import clsx from "clsx";
import type { ReactNode } from "react";
import { parseArtifactReference } from "../CloudArtifact/artifactReference";
import { LiveArtifactRenderer } from "../CloudArtifact/ArtifactRenderer";
import { names, styles } from "../CloudArtifact/cloudArtifact.styles";
import { DashboardCard, DashboardIllustration } from "./DashboardCard";

export const DASHBOARD_ARTIFACT_TYPE = "dashboard";

export const DASHBOARD_TOOL_NAMES = ["create_dashboard", "edit_dashboard"] as const;

export interface LiveArtifactRendererOptions {
  /** The component library the dashboards are built from. */
  library: Library;
  /** Where the dashboards' data tools run: your endpoint (`{ url }`) or an async function. */
  interpreter: Interpreter;
  /** The tool or tools that create and edit dashboards. Defaults to {@link DASHBOARD_TOOL_NAMES}. */
  toolName?: string | string[];
  /** Shown on the artifact browser's cards and in the workspace. Defaults to `"Dashboard"`. */
  label?: string;
  /** The thumbnail on the artifact browser's cards. Defaults to a dashboard illustration. */
  icon?: ReactNode;
}

interface DashboardArtifactProps {
  response?: string;
  id?: string;
}

// `<epoch ms>-<suffix>`: grows with every edit, so an open panel follows it.
const versionNumber = (version: string | undefined) => Number.parseInt(version ?? "", 10) || 1;

/**
 * An `AgentInterface` artifact renderer for OpenUI Cloud dashboards. Needs an `OpenUICloudProvider`.
 *
 * @category Functions
 *
 * @example
 * ```tsx
 * const dashboardArtifactRenderer = defineLiveArtifactRenderer({
 *   library,
 *   interpreter: { url: "/api/interpreter" },
 * });
 *
 * <OpenUICloudProvider token="/api/frontend-token">
 *   <AgentInterface artifactRenderers={[dashboardArtifactRenderer]} … />
 * </OpenUICloudProvider>
 * ```
 */
export function defineLiveArtifactRenderer({
  library,
  interpreter,
  toolName = [...DASHBOARD_TOOL_NAMES],
  label = "Dashboard",
  icon = <DashboardIllustration />,
}: LiveArtifactRendererOptions): ArtifactRendererConfig<DashboardArtifactProps> {
  return defineArtifactRenderer<DashboardArtifactProps>({
    type: DASHBOARD_ARTIFACT_TYPE,
    toolName,
    label,
    icon,
    parser: ({ response, id }) => {
      if (id) return { props: { id }, meta: { id, version: 1, heading: label } };
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
    preview: (props, controls) => (
      <LiveArtifactRenderer
        {...props}
        library={library}
        interpreter={interpreter}
        isOpen={controls.isActive}
        onOpenChange={(open) => (open ? controls.open() : controls.close())}
        renderInHtmlElement={null}
      >
        <LiveArtifactRenderer.Preview>
          <DashboardCard label={label} />
        </LiveArtifactRenderer.Preview>
      </LiveArtifactRenderer>
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
