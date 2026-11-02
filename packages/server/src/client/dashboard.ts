import { FRONTEND_TOKEN_HEADER } from "../shared/constants";
import { createInterpreter, dataToolLoader, toToolDefinitions } from "../tools/execute";
import { mcpServers } from "../tools/mcp";
import { assertUserIdRequired, ToolExecutionError, type ExecutionContext } from "../tools/types";
import { isRecord, type CloudApi } from "./api";
import { artifactConfig } from "./config";
import { createFrontendToken } from "./frontend-token";
import { OpenUIApiError, type Dashboard, type DashboardOptions } from "./types";

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
function toolResponse(id: string, title?: string): string {
  const version = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const header = {
    artifact_id: id,
    type: "live",
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
export function defineDashboard<Context extends ExecutionContext>(
  api: CloudApi,
  options: DashboardOptions<Context>,
): Dashboard<Context> {
  // Type-checked callers can't get these wrong; plain JavaScript callers can.
  const { library, model, promptOptions, tools, mcp } = options;
  if (typeof model !== "string" || !model.trim()) {
    invalidInput("model is required, as `provider/model`, such as anthropic/claude-sonnet-4.6");
  }
  if (!isRecord(library) || !isRecord(library.components)) {
    invalidInput("library is required as a library spec, such as `library.toSpec()`");
  }
  if (!isRecord(tools) && mcpServers(mcp).length === 0) {
    invalidInput("Dashboards need data tools: pass `tools`, `mcp`, or both");
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
    config = artifactConfig(library, promptOptions);
  } catch (error) {
    invalidLibrary(error);
  }

  /**
   * Mints the user's frontend token, so the artifact is theirs, and starts
   * generating in the background. Resolves with the artifact's id as soon as it has one.
   */
  async function start(
    context: Context,
    prompt: string,
    call: { title?: string; artifactId?: string },
    signal?: AbortSignal,
  ): Promise<string> {
    // The dashboard belongs to the user the context names.
    assertUserIdRequired(context);
    // Everything rides in the config block: tools and title for generation, the artifact an edit changes for OpenUI Cloud.
    const [{ token }, definitions] = await Promise.all([
      createFrontendToken(api, context.userId, signal),
      toolDefinitions(),
    ]);
    // Not streamed: OpenUI Cloud replies with the artifact's id at once and keeps generating.
    const { id } = await api.post(
      "/v1/artifact/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: config({ tools: definitions, ...call }) },
          { role: "user", content: prompt },
        ],
      },
      signal,
      { [FRONTEND_TOKEN_HEADER]: token },
    );
    if (typeof id !== "string" || !id) {
      throw new OpenUIApiError(
        "OpenUI Cloud didn't start a background artifact",
        "invalid_response",
        502,
      );
    }
    return id;
  }

  return {
    async create({ title, prompt }, context, { signal } = {}) {
      return toolResponse(await start(context, prompt, { title }, signal), title);
    },

    // OpenUI Cloud edits the version it stores.
    async edit({ id, prompt }, context, { signal } = {}) {
      if (typeof id !== "string" || !id) invalidInput("id is required");
      return toolResponse(await start(context, prompt, { artifactId: id }, signal));
    },

    interpreter: createInterpreter<Context>(api, loadTools),
  };
}
