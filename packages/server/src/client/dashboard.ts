import type { LibrarySpec } from "@openuidev/lang-core";
import { ARTIFACT_ID_HEADER, FRONTEND_TOKEN_HEADER } from "../shared/constants";
import { createInterpreter, dataToolLoader, toToolDefinitions } from "../tools/execute";
import { ToolExecutionError } from "../tools/types";
import { apiError, isRecord, type CloudApi } from "./api";
import { artifactConfig } from "./config";
import { createFrontendToken } from "./frontend-token";
import {
  OpenUIApiError,
  type ArtifactResult,
  type Dashboard,
  type DashboardOptions,
} from "./types";

/** How a dashboard's name may look: it rides with every artifact it makes. */
export const DASHBOARD_NAME = /^[A-Za-z0-9_-]{1,64}$/;

function invalidInput(message: string): never {
  throw new OpenUIApiError(message, "invalid_input");
}

function invalidLibrary(error: unknown): never {
  throw new OpenUIApiError(
    error instanceof Error ? error.message : String(error),
    "invalid_library",
  );
}

/**
 * What a tool returns to the model: a sentence, then the artifact's header line
 * for the renderer. A new `version` tells renderers there's a newer revision.
 */
function toolResponse(id: string, definition: string, title?: string): string {
  const version = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const header = {
    artifact_id: id,
    type: "live",
    definition,
    ...(title && { name: title }),
    version,
  };
  const sentence =
    title === undefined
      ? "Editing the dashboard; the user sees the new version when it's ready."
      : `Started the dashboard "${title}"; the user sees it as it's generated.`;
  return `${sentence}\n]]>openui:artifact ${JSON.stringify(header)}\n`;
}

/** The dashboard behind `openui.defineDashboard`. */
export function defineDashboard<Context>(
  api: CloudApi,
  options: DashboardOptions<Context>,
): Dashboard<Context> {
  // Type-checked callers can't get these wrong; plain JavaScript callers can.
  const { name, library, model, promptOptions, tools, mcp } = options;
  if (typeof name !== "string" || !DASHBOARD_NAME.test(name)) {
    invalidInput('name is required: 1 to 64 letters, digits, "_" or "-", such as "sales"');
  }
  if (typeof model !== "string" || !model.trim()) {
    invalidInput("model is required, as `provider/model`, such as anthropic/claude-sonnet-4.6");
  }
  if (typeof library?.toSpec !== "function") {
    invalidInput("library is required, such as one from createLibrary");
  }
  if (!isRecord(tools) && mcp === undefined) {
    invalidInput("Dashboards need data tools: pass `tools`, `mcp`, or both");
  }

  let spec: LibrarySpec;
  try {
    spec = library.toSpec();
  } catch (error) {
    invalidLibrary(error);
  }
  // One list of tools for generation and the interpreter; MCP tools are listed once.
  const loadTools = dataToolLoader<Context>({ tools, mcp } as DashboardOptions<Context>);

  /** What generation sees of your data tools and the MCP server's. */
  async function toolDefinitions() {
    try {
      return toToolDefinitions(await loadTools());
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw new OpenUIApiError(error.message, error.code, error.status);
      }
      throw error;
    }
  }

  // OpenUI Cloud's config block: your library and prompt options, then each call's tools and title.
  let config: ReturnType<typeof artifactConfig>;
  try {
    config = artifactConfig(spec, promptOptions);
  } catch (error) {
    invalidLibrary(error);
  }

  /**
   * Mints the user's frontend token, so the artifact is theirs, and starts
   * generating in the background. Resolves with the artifact's id as soon as it has one.
   */
  async function start(
    userId: string,
    prompt: string,
    thesys: Record<string, unknown>,
    title: string | undefined,
    signal?: AbortSignal,
  ): Promise<string> {
    // The config block carries what generation needs; metadata, which dashboard and (on edits) which artifact.
    const [{ token }, definitions] = await Promise.all([
      createFrontendToken(api, userId, signal),
      toolDefinitions(),
    ]);
    const response = await api.request("/v1/artifact/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", [FRONTEND_TOKEN_HEADER]: token },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: config(definitions, title) },
          { role: "user", content: prompt },
        ],
        // Chat completions metadata values are strings.
        metadata: {
          thesys: JSON.stringify({ definition: name, ...thesys }),
        },
      }),
      signal,
    });
    if (!response.ok) throw await apiError(response);
    const id = response.headers.get(ARTIFACT_ID_HEADER);
    // The generation carries on in OpenUI Cloud; renderers read it from there.
    await response.body?.cancel().catch(() => undefined);
    if (!id) {
      throw new OpenUIApiError(
        "OpenUI Cloud didn't start a background artifact",
        "invalid_response",
        502,
      );
    }
    return id;
  }

  return {
    name,

    async create({ userId, title, prompt }, { signal } = {}): Promise<ArtifactResult> {
      const id = await start(userId, prompt, {}, title, signal);
      return { id, response: toolResponse(id, name, title) };
    },

    // OpenUI Cloud edits the version it stores, and checks this dashboard made it.
    async edit({ id, userId, prompt }, { signal } = {}): Promise<ArtifactResult> {
      if (typeof id !== "string" || !id) invalidInput("id is required");
      const edited = await start(userId, prompt, { id }, undefined, signal);
      return { id: edited, response: toolResponse(edited, name) };
    },

    interpreter: createInterpreter<Context>(api, loadTools),
  };
}
