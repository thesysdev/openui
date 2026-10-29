import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { ARTIFACT_ID_HEADER, FRONTEND_TOKEN_HEADER } from "../shared/constants";
import { toToolDefinitions } from "../tools/execute";
import { mcpToolLoader, mergeTools } from "../tools/mcp";
import { ToolExecutionError } from "../tools/types";
import { apiError, isRecord, type CloudApi } from "./api";
import { createFrontendToken } from "./frontend-token";
import {
  OpenUIApiError,
  type ArtifactResult,
  type ArtifactTool,
  type ArtifactToolOptions,
} from "./types";

type ArtifactType = "live" | "static";

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
function toolResponse(id: string, type: ArtifactType, title?: string): string {
  const version = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const header = { artifact_id: id, type, ...(title && { name: title }), version };
  const sentence =
    title === undefined
      ? `Editing the ${type} artifact; the user sees the new version when it's ready.`
      : `Started the ${type} artifact "${title}"; the user sees it as it's generated.`;
  return `${sentence}\n]]>openui:artifact ${JSON.stringify(header)}\n`;
}

const ARTIFACT_KINDS = new Set<string>(["dashboard", "slides", "report"]);

/** The artifact tool behind `openui.defineArtifactTool`. */
export function defineArtifactTool(api: CloudApi, options: ArtifactToolOptions): ArtifactTool {
  // Type-checked callers can't get these wrong; plain JavaScript callers can.
  const { type = "static", kind = "dashboard", library, model, promptOptions, tools, mcp } = options;
  if (type !== "live" && type !== "static") invalidInput('type must be "live" or "static"');
  if (!ARTIFACT_KINDS.has(kind)) invalidInput('kind must be "dashboard", "slides" or "report"');
  if (typeof model !== "string" || !model.trim()) {
    invalidInput("model is required, as `provider/model`, such as anthropic/claude-sonnet-4.6");
  }
  if (typeof library?.toSpec !== "function") {
    invalidInput("library is required, such as one from createLibrary");
  }
  if (type === "live" && !isRecord(tools) && mcp === undefined) {
    invalidInput("Live artifacts need data tools: pass `tools`, `mcp`, or both");
  }
  if (type === "static" && (tools !== undefined || mcp !== undefined)) {
    invalidInput("Static artifacts don't run data tools: remove `tools` and `mcp`");
  }

  let spec: LibrarySpec;
  try {
    spec = library.toSpec();
  } catch (error) {
    invalidLibrary(error);
  }
  const loadMcp = mcp === undefined ? undefined : mcpToolLoader(mcp);

  /** What generation sees of your data tools and the MCP server's. */
  async function toolDefinitions() {
    if (type === "static") return undefined;
    if (!loadMcp) return toToolDefinitions(tools ?? {});
    try {
      return toToolDefinitions(mergeTools(tools, await loadMcp()));
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw new OpenUIApiError(error.message, error.code, error.status);
      }
      throw error;
    }
  }

  /** OpenUI Cloud's config block: your library, prompt options and data tools. */
  async function config(title?: string): Promise<string> {
    const definitions = await toolDefinitions();
    try {
      return generateSystemPrompt({
        cloud: true,
        library: spec,
        ...(promptOptions && { promptOptions }),
        ...(definitions && { script: { tools: definitions } }),
        ...(title !== undefined && { meta: { name: title } }),
      });
    } catch (error) {
      invalidLibrary(error);
    }
  }

  /**
   * Mints the user's frontend token, so the artifact is theirs, and starts
   * generating in the background. Resolves with the artifact's id as soon as it has one.
   */
  async function start(
    userId: string,
    prompt: string,
    title: string | undefined,
    thesys: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<string> {
    const [{ token }, system] = await Promise.all([
      createFrontendToken(api, userId, signal),
      config(title),
    ]);
    const response = await api.request("/v1/artifact/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", [FRONTEND_TOKEN_HEADER]: token },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        // Chat completions metadata values are strings.
        metadata: { thesys: JSON.stringify({ c1_artifact_type: type, ...thesys }) },
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
    type,
    kind,

    async create({ userId, title, description, prompt }, { signal } = {}): Promise<ArtifactResult> {
      const thesys = { title, kind, ...(description !== undefined && { description }) };
      const id = await start(userId, prompt, title, thesys, signal);
      return { id, response: toolResponse(id, type, title) };
    },

    // OpenUI Cloud edits the version it stores, and checks it's this type.
    async edit({ id, userId, prompt }, { signal } = {}): Promise<ArtifactResult> {
      if (typeof id !== "string" || !id) invalidInput("id is required");
      const edited = await start(userId, prompt, undefined, { id }, signal);
      return { id: edited, response: toolResponse(edited, type) };
    },
  };
}
