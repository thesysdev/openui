import { createArtifacts } from "..";
import { actAsFields } from "../../core/act-as";
import { invalidInput, OpenUIApiError } from "../../core/errors";
import { isRecord } from "../../core/guards";
import type { CloudApi } from "../../core/http";
import { requireId, type RequestOptions } from "../../core/resource";
import { createInterpreter, dataToolLoader, toToolDefinitions } from "../../interpreter/execute";
import { mcpServers } from "../../interpreter/mcp";
import {
  assertUserIdRequired,
  ToolExecutionError,
  type ExecutionContext,
} from "../../interpreter/types";
import { artifactConfig } from "./config";
import { runToolRound, type ModelToolCall, type ToolMessage } from "./tool-round";
import type { Dashboard, DashboardOptions } from "./types";

/** OpenUI Cloud's route that builds and edits dashboards, round by round. */
const DASHBOARD_ROUTE = "/v1/dashboard/chat/completions";

function invalidLibrary(error: unknown): never {
  throw new OpenUIApiError(
    error instanceof Error ? error.message : String(error),
    "invalid_library",
  );
}

/** A chat message as OpenAI's Chat Completions API takes it: a build's first
 *  request has the config block and the user's prompt, each later round the
 *  results of the model's tool calls. */
type ChatMessage = { role: "system" | "user"; content: string } | ToolMessage;

/** The dashboard behind `openui.defineDashboard`. */
export function defineDashboard<Context extends ExecutionContext>(
  api: CloudApi,
  options: DashboardOptions<Context>,
): Dashboard<Context> {
  // Type-checked callers can't get these wrong; plain JavaScript callers can.
  const {
    library,
    model,
    reasoningEffort,
    maxToolRounds,
    promptOptions,
    instructions,
    tools,
    mcp,
  } = options;
  if (typeof model !== "string" || !model.trim()) {
    invalidInput("model is required, as `provider/model`, such as anthropic/claude-sonnet-4.6");
  }
  if (!isRecord(library) || !isRecord(library.components)) {
    invalidInput("library is required as a library spec, such as `library.toSpec()`");
  }
  if (instructions !== undefined && typeof instructions !== "string") {
    invalidInput("instructions must be a string");
  }
  if (!isRecord(tools) && mcpServers(mcp).length === 0) {
    invalidInput("Dashboards need data tools: pass `tools`, `mcp`, or both");
  }

  const artifacts = createArtifacts(api);
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

  // OpenUI Cloud's config block: your library, prompt options and instructions, then each call's tools and title.
  let config: ReturnType<typeof artifactConfig>;
  try {
    config = artifactConfig(library, promptOptions, instructions);
  } catch (error) {
    invalidLibrary(error);
  }

  /** The first request of a build: the config block and the user's prompt. */
  async function initialMessages(
    context: Context,
    prompt: string,
    call: { title?: string; id?: string },
  ): Promise<ChatMessage[]> {
    // The dashboard belongs to the user the context names, in the client's app if it has one,
    // as a frontend token minted for them would say.
    assertUserIdRequired(context);
    // Everything rides in the config block: tools and title for generation, the artifact an edit changes for OpenUI Cloud.
    // The model may call these data tools, and openui_create_script, whose saved scripts
    // this server runs (see runToolRound).
    const definitions = await toolDefinitions();
    return [
      {
        role: "system",
        content: config({
          tools: definitions,
          ...call,
          ...(maxToolRounds !== undefined && { maxToolRounds }),
        }),
      },
      { role: "user", content: prompt },
    ];
  }

  const request = (
    context: Context,
    messages: ChatMessage[],
    artifactId: string | undefined,
    edit: boolean,
  ) => ({
    model,
    messages,
    ...(artifactId !== undefined && { artifact_id: artifactId }),
    ...(reasoningEffort !== undefined && { reasoning_effort: reasoningEffort }),
    // An edit can come from a share to one of the user's groups; a new dashboard is the user's alone.
    ...actAsFields(api, { userId: context.userId, groupIds: edit ? context.groupIds : undefined }),
  });

  /** How a round ended: the dashboard started, or the model's tool calls to run. */
  type Round = { done: true } | { calls: ModelToolCall[]; artifactId: string; version?: string };
  /** The dashboard's id and the build's version, as far as the build has them. */
  type Ids = { artifactId?: string; version?: string };

  const notStarted = () =>
    new OpenUIApiError("OpenUI Cloud didn't start a background artifact", "invalid_response", 502);

  /**
   * One round, not streamed: OpenUI Cloud replies at once and keeps generating. Once the
   * dashboard starts, yields the tool response OpenUI Cloud writes: a sentence for the model and
   * the artifact's header line for the renderer. Each tool-call reply names the id and version.
   */
  async function* readReply(
    body: unknown,
    _ids: Ids,
    signal?: AbortSignal,
  ): AsyncGenerator<string, Round> {
    const reply = await api.send("POST", DASHBOARD_ROUTE, { body, signal });
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
      yield message["content"];
      return { done: true };
    }
    const toolCalls = isRecord(message) ? message["tool_calls"] : undefined;
    if (!Array.isArray(toolCalls) || !toolCalls.length) throw notStarted();
    return {
      calls: toolCalls,
      artifactId: reply["artifact_id"] as string,
      version: reply["artifact_version"] as string | undefined,
    };
  }

  /**
   * One round, streamed: yields each message OpenUI Cloud sends. The first says the dashboard
   * started, as soon as it has an id; the last says whether it was saved. Each is a whole
   * message. The id and version may come in any round, so earlier ones carry over.
   */
  async function* readStream(
    body: unknown,
    ids: Ids,
    signal?: AbortSignal,
  ): AsyncGenerator<string, Round> {
    let { artifactId, version } = ids;
    const calls: Array<{ id: string; function: { name: string; arguments: string } }> = [];
    let finish: unknown;
    for await (const chunk of api.stream(DASHBOARD_ROUTE, body, signal)) {
      if (typeof chunk["artifact_id"] === "string") artifactId = chunk["artifact_id"];
      if (typeof chunk["artifact_version"] === "string") version = chunk["artifact_version"];
      const choice: unknown = Array.isArray(chunk["choices"]) ? chunk["choices"][0] : undefined;
      if (!isRecord(choice)) continue;
      const delta = isRecord(choice["delta"]) ? choice["delta"] : {};
      if (typeof delta["content"] === "string" && delta["content"]) yield delta["content"];
      if (Array.isArray(delta["tool_calls"])) {
        for (const part of delta["tool_calls"]) {
          const index = Number(part.index ?? calls.length);
          const call = (calls[index] ??= { id: "", function: { name: "", arguments: "" } });
          call.id ||= part.id ?? "";
          call.function.name += part.function?.name ?? "";
          call.function.arguments += part.function?.arguments ?? "";
        }
      }
      if (choice["finish_reason"]) finish = choice["finish_reason"];
    }
    if (finish === "stop") return { done: true };
    if (finish === undefined) {
      throw new OpenUIApiError(
        "OpenUI Cloud's stream ended before the build did",
        "invalid_response",
        502,
      );
    }
    if (finish !== "tool_calls" || !calls.length || artifactId === undefined) throw notStarted();
    return { calls, artifactId, version };
  }

  /**
   * A build: runs the model's tool rounds, then starts generating the user's dashboard in the
   * background. Yields what `readRound` yields.
   */
  async function* build(
    readRound: typeof readReply,
    context: Context,
    prompt: string,
    call: { title?: string; id?: string },
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    let messages = await initialMessages(context, prompt, call);
    // From the first tool-call round on: later rounds and saved scripts go by them.
    let ids: Ids = {};
    // OpenUI Cloud ends the rounds: the model writes once it's done, or at maxToolRounds.
    for (;;) {
      const body = request(context, messages, ids.artifactId, call.id !== undefined);
      const round = yield* readRound(body, ids, signal);
      if ("done" in round) return;
      const { calls, artifactId, version } = round;
      ids = { artifactId, version };
      // OpenUI Cloud keeps the build's turns: send only the new results.
      const tools = await loadTools();
      messages = await runToolRound({
        calls,
        tools,
        context,
        signal,
        interpreter,
        artifactId,
        version,
      });
    }
  }

  /**
   * Runs a build plain or streamed. `args` is read inside, so bad arguments fail the call like
   * any other error: the promise rejects, or the stream throws when read.
   */
  function run(
    options: (RequestOptions & { stream?: boolean }) | undefined,
    context: Context,
    args: () => { prompt: string; call: { title?: string; id?: string } },
  ) {
    const signal = options?.signal;
    if (options?.stream) {
      return (async function* () {
        const { prompt, call } = args();
        yield* build(readStream, context, prompt, call, signal);
      })();
    }
    return (async () => {
      const { prompt, call } = args();
      let started = "";
      for await (const message of build(readReply, context, prompt, call, signal)) {
        started = message;
      }
      return started;
    })();
  }

  return {
    create(params, context, options = {}) {
      return run(options, context, () => ({
        prompt: params.prompt,
        call: { title: params.title },
      })) as never;
    },

    // OpenUI Cloud edits the version it stores.
    edit(params, context, options = {}) {
      return run(options, context, () => ({
        prompt: params.prompt,
        call: { id: requireId(params.id, "id") },
      })) as never;
    },

    // Always as the user, never the org: the model picks the id.
    async get({ id }, context, { signal } = {}) {
      assertUserIdRequired(context);
      const { userId, groupIds } = context;
      return artifacts.get(id, { userId, groupIds, signal });
    },

    interpreter,
  };
}
