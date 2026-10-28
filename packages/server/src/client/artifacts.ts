import { generateSystemPrompt } from "@openuidev/lang-core";
import { ARTIFACT_ID_HEADER, FRONTEND_TOKEN_HEADER } from "../shared/constants";
import { readSSE } from "../shared/sse";
import { toToolDefinitions } from "../tools/execute";
import { apiError, isRecord, type CloudApi } from "./api";
import {
  OpenUIApiError,
  type ArtifactError,
  type ArtifactLibrary,
  type ArtifactPromptOptions,
  type ArtifactRequestOptions,
  type ArtifactResult,
  type ArtifactResultFor,
  type ArtifactTool,
  type CreateLiveArtifactParams,
  type CreateStaticArtifactParams,
  type EditLiveArtifactParams,
  type EditStaticArtifactParams,
  type GeneratedArtifact,
} from "./types";

type ArtifactKind = "live" | "static";

const MAX_RECONNECTS = 3;
const ERROR_CODES = new Set<string>(["not-found", "generation-failed", "network-error"]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function invalidInput(message: string): never {
  throw new OpenUIApiError(message, "invalid_input");
}

// Type-checked callers can't pass tools for a static artifact; plain JavaScript callers can.
function rejectTools(params: object): void {
  if ((params as Record<string, unknown>)["tools"] !== undefined) {
    invalidInput("Static artifacts don't run data tools: remove `tools`");
  }
}

/**
 * What generation needs from your side, as OpenUI Cloud's config block: the
 * library, prompt options, data tools and, for an edit, the previous artifact.
 */
function cloudConfig(input: {
  library: ArtifactLibrary;
  tools?: Record<string, ArtifactTool>;
  promptOptions?: ArtifactPromptOptions;
  content?: string;
  title?: string;
}): string {
  try {
    return generateSystemPrompt({
      cloud: true,
      library: input.library.toSpec(),
      ...(input.promptOptions && { promptOptions: input.promptOptions }),
      ...(input.tools && { script: { tools: toToolDefinitions(input.tools) } }),
      ...(input.content !== undefined && { baseResponse: input.content }),
      ...(input.title !== undefined && { meta: { name: input.title } }),
    });
  } catch (error) {
    throw new OpenUIApiError(
      error instanceof Error ? error.message : String(error),
      "invalid_library",
    );
  }
}

function requireUser(userId: unknown): void {
  if (typeof userId !== "string" || !userId.trim()) {
    invalidInput("userId is required: take it from your authenticated session");
  }
}

function requireModel(model: unknown): void {
  if (typeof model !== "string" || !model.trim()) {
    invalidInput("model is required, as `provider/model`, such as anthropic/claude-sonnet-4.6");
  }
}

/**
 * What a tool returns to the model: a sentence, then the artifact's header line
 * for the renderer. A new `version` tells renderers there's a newer revision.
 */
function toolResponse(
  id: string,
  kind: ArtifactKind | undefined,
  title: string | undefined,
): string {
  const version = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const header = {
    artifact_id: id,
    ...(kind && { type: kind }),
    ...(title && { name: title }),
    version,
  };
  const sentence = kind
    ? `Started the ${kind} artifact${title ? ` "${title}"` : ""}; the user sees it as it's generated.`
    : "Editing the artifact; the user sees the new version when it's ready.";
  return `${sentence}\n]]>openui:artifact ${JSON.stringify(header)}\n`;
}

/** What a generation request carries besides the prompt. */
interface GenerationInput {
  userId: string;
  prompt: string;
  model: string;
  /** The config block from your library, tools and prompt options. */
  config: string;
  thesys: Record<string, unknown>;
  signal?: AbortSignal;
}

/** Create and edit artifacts. Each call returns as soon as the artifact has an id. */
export class Artifacts {
  constructor(private readonly api: CloudApi) {}

  /** Your components, with live data from your tools. */
  async createLive<P extends CreateLiveArtifactParams>(
    params: P,
    options?: ArtifactRequestOptions,
  ): Promise<ArtifactResultFor<P>> {
    return this.create("live", params, options);
  }

  /** Your components, no data tools. */
  async createStatic<P extends CreateStaticArtifactParams>(
    params: P,
    options?: ArtifactRequestOptions,
  ): Promise<ArtifactResultFor<P>> {
    rejectTools(params);
    return this.create("static", params, options);
  }

  /**
   * Edits a live artifact in place, with the library and data tools it was
   * created with. Renderers keep the current version until the edit is ready.
   */
  async editLive<P extends EditLiveArtifactParams>(
    params: P,
    options?: ArtifactRequestOptions,
  ): Promise<ArtifactResultFor<P>> {
    return this.edit(params, options);
  }

  /** Edits a static artifact in place, with the library it was created with. */
  async editStatic<P extends EditStaticArtifactParams>(
    params: P,
    options?: ArtifactRequestOptions,
  ): Promise<ArtifactResultFor<P>> {
    rejectTools(params);
    return this.edit(params, options);
  }

  private async edit<P extends EditLiveArtifactParams | EditStaticArtifactParams>(
    params: P,
    { signal }: ArtifactRequestOptions = {},
  ): Promise<ArtifactResultFor<P>> {
    const { id, prompt, userId, library, tools, promptOptions, content, store, model } = params;
    if (typeof id !== "string" || !id) invalidInput("id is required");
    requireUser(userId);
    requireModel(model);
    if (store === false && typeof content !== "string") {
      invalidInput("With store: false, pass the artifact's saved content");
    }
    // OpenUI Cloud edits the version it stores; your own storage sends it as the config's base.
    const started = await this.start({
      userId,
      prompt,
      model,
      config: cloudConfig({ library, tools, promptOptions, content }),
      thesys: { id, ...(store !== undefined && { store }) },
      signal,
    });
    return this.result<P>(started, undefined, undefined, store);
  }

  private async create<P extends CreateLiveArtifactParams | CreateStaticArtifactParams>(
    kind: ArtifactKind,
    params: P,
    { signal }: ArtifactRequestOptions = {},
  ): Promise<ArtifactResultFor<P>> {
    const { title, description, prompt, userId, library, tools, promptOptions, store, model } =
      params;
    requireUser(userId);
    requireModel(model);
    const id = await this.start({
      userId,
      prompt,
      model,
      config: cloudConfig({ library, tools, promptOptions, title }),
      thesys: {
        c1_artifact_type: kind,
        title,
        ...(description !== undefined && { description }),
        ...(store !== undefined && { store }),
      },
      signal,
    });
    return this.result<P>(id, kind, title, store);
  }

  /**
   * Mints the user's frontend token, so the artifact is theirs, and starts
   * generating in the background. Resolves with the artifact's id as soon as it has one.
   */
  private async start({
    userId,
    prompt,
    model,
    config,
    thesys,
    signal,
  }: GenerationInput): Promise<string> {
    const { token } = await this.api.post("/v1/frontend-tokens", { user_id: userId }, signal);
    if (typeof token !== "string" || !token) {
      throw new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
    }
    const response = await this.api.request("/v1/artifact/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", [FRONTEND_TOKEN_HEADER]: token },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: config },
          { role: "user", content: prompt },
        ],
        // Chat completions metadata values are strings.
        metadata: { thesys: JSON.stringify(thesys) },
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

  private result<P>(
    id: string,
    kind: ArtifactKind | undefined,
    title: string | undefined,
    store: boolean | undefined,
  ): ArtifactResultFor<P> {
    const result: ArtifactResult = { id, toolResponse: toolResponse(id, kind, title) };
    // Start following right away: an unstored artifact only lives while it's generated.
    return (
      store === false ? { ...result, done: follow(this.api, id) } : result
    ) as ArtifactResultFor<P>;
  }
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

function parseData(data: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(data);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function errorCode(code: unknown): ArtifactError["code"] {
  const normalized = typeof code === "string" ? code.replace(/^artifact[-/]/, "") : "";
  return ERROR_CODES.has(normalized) ? (normalized as ArtifactError["code"]) : "generation-failed";
}

/** Follows an artifact's stream to its end, resuming after drops, and resolves with the result. */
async function follow(api: CloudApi, id: string): Promise<GeneratedArtifact> {
  const artifact: GeneratedArtifact = { id, content: "" };
  const fail = (code: ArtifactError["code"], message: string): GeneratedArtifact => ({
    ...artifact,
    error: { source: "artifact", code, message },
  });
  let lastEventId: string | undefined;
  let reconnects = 0;

  for (;;) {
    try {
      const response = await api.request(`/v1/artifacts/${encodeURIComponent(id)}/stream`, {
        headers: {
          Accept: "text/event-stream",
          ...(lastEventId && { "Last-Event-ID": lastEventId }),
        },
      });
      if (response.status === 404) return fail("not-found", "The artifact was not found.");
      if (response.ok && response.body) {
        for await (const message of readSSE(response.body)) {
          if (message.id) lastEventId = message.id;
          reconnects = 0;
          const data = parseData(message.data);
          if (message.event === "reference") {
            // An edit starts over from a new reference.
            for (const key of ["type", "title", "description"] as const) {
              const value = asString(data[key]);
              if (value !== undefined) artifact[key] = value;
            }
            artifact.content = "";
          } else if (message.event === "delta") {
            artifact.content += asString(data["text"]) ?? "";
          } else if (message.event === "end") {
            artifact.content = asString(data["content"]) ?? artifact.content;
            const summary = asString(data["summary"]);
            if (summary !== undefined) artifact.summary = summary;
            return artifact;
          } else if (message.event === "error") {
            const summary = asString(data["summary"]);
            if (summary !== undefined) artifact.summary = summary;
            return fail(
              errorCode(data["code"]),
              asString(data["message"]) ?? "The artifact couldn't be generated.",
            );
          }
        }
      }
    } catch {
      // Dropped: resume below.
    }
    if (reconnects >= MAX_RECONNECTS) {
      return fail("network-error", "Couldn't reach OpenUI Cloud to follow the artifact.");
    }
    reconnects += 1;
    await sleep(500 * 2 ** (reconnects - 1));
  }
}
