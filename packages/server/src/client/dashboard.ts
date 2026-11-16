import { createInterpreter, dataToolLoader, toToolDefinitions } from "../tools/execute";
import { mcpServers } from "../tools/mcp";
import { CREATE_SCRIPT_TOOL, probeRound } from "../tools/probe";
import { assertUserIdRequired, ToolExecutionError, type ExecutionContext } from "../tools/types";
import { isRecord, type CloudApi } from "./api";
import { artifactConfig } from "./config";
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

/** The dashboard behind `openui.defineDashboard`. */
export function defineDashboard<Context extends ExecutionContext>(
  api: CloudApi,
  options: DashboardOptions<Context>,
): Dashboard<Context> {
  // Type-checked callers can't get these wrong; plain JavaScript callers can.
  const { library, model, promptOptions, tools, mcp, probe } = options;
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
  const interpreter = createInterpreter<Context>(api, loadTools);

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
   * Starts generating the user's dashboard in the background. Resolves as
   * soon as OpenUI Cloud has the artifact, with the tool response it writes:
   * a sentence for the model and the artifact's header line for the renderer.
   */
  async function start(
    context: Context,
    prompt: string,
    call: { title?: string; id?: string },
    signal?: AbortSignal,
  ): Promise<string> {
    // The dashboard belongs to the user the context names, in the client's app if it has one,
    // as a frontend token minted for them would say.
    assertUserIdRequired(context);
    // Everything rides in the config block: tools and title for generation, the artifact an edit changes for OpenUI Cloud.
    const definitions = await toolDefinitions();
    const messages: unknown[] = [
      { role: "system", content: config({ tools: definitions, ...call }) },
      { role: "user", content: prompt },
    ];
    const probeTools =
      probe === false || definitions.length === 0
        ? undefined
        : [
            ...definitions.map(({ name, description, parameters }) => ({
              type: "function",
              function: {
                name,
                ...(description !== undefined && { description }),
                parameters: parameters ?? { type: "object", properties: {} },
              },
            })),
            // Says this server runs the scripts the model saves (see probeRound),
            // unless one of your tools has that name.
            ...(definitions.some(({ name }) => name === CREATE_SCRIPT_TOOL)
              ? []
              : [
                  {
                    type: "function",
                    function: {
                      name: CREATE_SCRIPT_TOOL,
                      parameters: { type: "object", properties: {} },
                    },
                  },
                ]),
          ];
    // The build OpenUI Cloud keeps the model's saved scripts under, from its first tool-call reply.
    let draftId: string | undefined;
    // No round limit: OpenUI Cloud decides when the model stops asking for tools.
    for (;;) {
      // Not streamed: OpenUI Cloud replies at once and keeps generating.
      // Tools go with every request: without them, earlier tool results are ignored.
      const reply = await api.post(
        "/v1/dashboard/chat/completions",
        {
          model,
          messages,
          ...(probeTools && { tools: probeTools }),
          ...(draftId !== undefined && { draft_id: draftId }),
          user_id: context.userId,
          ...(api.appId !== undefined && { app_id: api.appId }),
        },
        signal,
      );
      const choice: unknown = Array.isArray(reply["choices"]) ? reply["choices"][0] : undefined;
      const message = isRecord(choice) ? choice["message"] : undefined;
      // The dashboard started: the message is the tool response for your agent's model.
      if (
        isRecord(choice) &&
        choice["finish_reason"] === "stop" &&
        isRecord(message) &&
        typeof message["content"] === "string" &&
        message["content"]
      ) {
        return message["content"];
      }
      const toolCalls = isRecord(message) ? message["tool_calls"] : undefined;
      if (
        !probeTools ||
        !Array.isArray(toolCalls) ||
        !toolCalls.length ||
        !toolCalls.every((toolCall) => isRecord(toolCall) && typeof toolCall["id"] === "string")
      ) {
        throw new OpenUIApiError(
          "OpenUI Cloud didn't start a background artifact",
          "invalid_response",
          502,
        );
      }
      if (typeof reply["draft_id"] === "string" && reply["draft_id"]) draftId = reply["draft_id"];
      messages.push(
        message,
        ...(await probeRound(toolCalls, await loadTools(), context, signal, interpreter, draftId)),
      );
    }
  }

  return {
    async create({ title, prompt }, context, { signal } = {}) {
      return start(context, prompt, { title }, signal);
    },

    // OpenUI Cloud edits the version it stores.
    async edit({ id, prompt }, context, { signal } = {}) {
      if (typeof id !== "string" || !id) invalidInput("id is required");
      return start(context, prompt, { id }, signal);
    },

    interpreter,
  };
}
