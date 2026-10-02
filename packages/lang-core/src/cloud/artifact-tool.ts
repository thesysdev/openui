import type { DashboardTools } from "./dashboard";
import type { DashboardGenerationTool } from "./dashboard/types";

type ArtifactKind = "slides" | "report" | "dashboard";

interface ArtifactOption {
  type: ArtifactKind;
  /** Per-artifact instruction, folded into the Cloud tool description. */
  instruction?: string;
  /** Override this package's pinned library version for this artifact. */
  libraryVersion?: string;
  /** Dashboard only: the result of `createDashboardTools()`. Context is unused here. */
  tools?: DashboardTools<never>;
}

export interface ArtifactToolOptions {
  /** Which artifacts to enable. Omit to enable all artifact types. */
  artifacts?: Array<ArtifactKind | ArtifactOption>;
}

interface ArtifactWireEntry {
  artifact_type: ArtifactKind;
  instruction?: string;
  library_version?: string;
}

/** The Responses `tools[]` entry enabling OpenUI Cloud's managed artifact tool. */
interface ResponsesArtifactToolEntry {
  type: "artifact";
  /** Absent → all supported artifact types enabled. */
  artifacts?: ArtifactWireEntry[];
}

/**
 * Wire pins for OpenUI Cloud's managed artifact libraries. Cloud rejects a
 * non-numeric or too-old version.
 */
const SLIDES_LIBRARY_VERSION = "0.1.0";
const REPORT_LIBRARY_VERSION = "0.1.0";
const DASHBOARD_LIBRARY_VERSION = "0.1.0";

const DEFAULT_LIBRARY_VERSION: Record<ArtifactKind, string> = {
  slides: SLIDES_LIBRARY_VERSION,
  report: REPORT_LIBRARY_VERSION,
  dashboard: DASHBOARD_LIBRARY_VERSION,
};

/**
 * Renders dashboard data-tool definitions into the artifact instruction, which
 * Cloud folds into the generate/edit tool description.
 */
function renderDashboardToolDocs(tools: DashboardGenerationTool[]): string {
  const blocks = tools.map((tool) =>
    [
      `### ${tool.name}`,
      ...(tool.description ? [tool.description] : []),
      `parameters: ${JSON.stringify(tool.parameters ?? { type: "object", properties: {} })}`,
      ...(tool.sample !== undefined ? [`sample_output: ${JSON.stringify(tool.sample)}`] : []),
    ].join("\n"),
  );
  return [
    "Data tools available for dashboards in this conversation. When calling this tool, pass every relevant definition in the structured `tools` argument, copying name/description/parameters/sample_output verbatim from below:",
    ...blocks,
  ].join("\n\n");
}

/**
 * Build the Responses `tools[]` entry that enables Cloud's managed artifact tool.
 *
 *   tools: [artifactTool()]                          // all artifact types
 *   tools: [artifactTool({ artifacts: ["report"] })] // report only
 *   tools: [artifactTool({
 *     artifacts: [
 *       { type: "slides", instruction: "Use the corporate template." },
 *       { type: "dashboard", tools: dashboardTools },
 *       "report",
 *     ],
 *   })]
 *
 * Pass at most one artifactTool() entry per request — Cloud keys the
 * artifact config by tool type, so a second entry silently replaces the first.
 */
export function artifactTool(options: ArtifactToolOptions = {}): ResponsesArtifactToolEntry {
  const { artifacts } = options;
  if (artifacts === undefined) {
    // Emit every supported type WITH its library_version so Cloud resolves to
    // the OpenUI Lang format. A bare `{ type: "artifact" }` with no
    // library_version is the legacy shape — not what a lang-core caller wants.
    return {
      type: "artifact",
      artifacts: (Object.keys(DEFAULT_LIBRARY_VERSION) as ArtifactKind[]).map((kind) => ({
        artifact_type: kind,
        library_version: DEFAULT_LIBRARY_VERSION[kind],
      })),
    };
  }
  if (artifacts.length === 0) {
    throw new Error(
      "artifactTool: `artifacts` must not be empty — omit it to enable all artifact types.",
    );
  }

  const seen = new Set<ArtifactKind>();
  const entries: ArtifactWireEntry[] = artifacts.map((artifact) => {
    const opt: ArtifactOption = typeof artifact === "string" ? { type: artifact } : artifact;
    if (!(opt.type in DEFAULT_LIBRARY_VERSION)) {
      throw new Error(
        `artifactTool: unknown artifact type '${opt.type}'. Supported: ${Object.keys(DEFAULT_LIBRARY_VERSION).join(", ")}.`,
      );
    }
    if (seen.has(opt.type)) {
      throw new Error(`artifactTool: duplicate artifact '${opt.type}'.`);
    }
    seen.add(opt.type);
    if (opt.tools !== undefined && opt.type !== "dashboard") {
      throw new Error(
        `artifactTool: \`tools\` is only valid on the 'dashboard' entry (got '${opt.type}').`,
      );
    }
    const toolDocs = opt.tools ? renderDashboardToolDocs(opt.tools.generationTools) : undefined;
    const instruction = [opt.instruction, toolDocs].filter(Boolean).join("\n\n");
    return {
      artifact_type: opt.type,
      ...(instruction && { instruction }),
      library_version: opt.libraryVersion ?? DEFAULT_LIBRARY_VERSION[opt.type],
    };
  });
  return { type: "artifact", artifacts: entries };
}
