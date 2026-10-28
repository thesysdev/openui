import { generateSystemPrompt } from "@openuidev/lang-core";
import { readSSE } from "../shared/sse";
import { toToolDefinitions } from "../tools/execute";
import { isRecord, type CloudApi } from "./api";
import {
  OpenUIApiError,
  type ArtifactError,
  type ArtifactLibrary,
  type ArtifactPromptOptions,
  type ArtifactResult,
  type ArtifactResultFor,
  type ArtifactTool,
  type CreateArtifactBase,
  type CreateLiveArtifactParams,
  type CreateReportParams,
  type CreateSlidesParams,
  type CreateStaticArtifactParams,
  type EditArtifactParams,
  type GeneratedArtifact,
} from "./types";

type ArtifactKind = "live" | "static" | "slides" | "report";

type CreateParams = CreateArtifactBase & {
  library?: ArtifactLibrary;
  tools?: Record<string, ArtifactTool>;
  promptOptions?: ArtifactPromptOptions;
};

const MAX_RECONNECTS = 3;
const ERROR_CODES = new Set<string>(["not-found", "generation-failed", "network-error"]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function invalidInput(message: string): never {
  throw new OpenUIApiError(message, "invalid_input");
}

const BUILT_IN = { library: "components", tools: "data", promptOptions: "prompts" } as const;

// Type-checked callers can't pass these; plain JavaScript callers can.
function reject(params: object, keys: Array<keyof typeof BUILT_IN>, kind: string): void {
  for (const key of keys) {
    if ((params as Record<string, unknown>)[key] !== undefined) {
      invalidInput(`${kind} use built-in ${BUILT_IN[key]}: remove \`${key}\``);
    }
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
  model: string | undefined;
  /** The config block from your library, tools and prompt options. */
  config?: string;
  /** The previous version, for an edit of an artifact in your own storage. */
  previous?: string;
  thesys: Record<string, unknown>;
  signal?: AbortSignal;
}

/** Create and edit artifacts. Each call returns as soon as the artifact has an id. */
export class Artifacts {
  constructor(
    private readonly api: CloudApi,
    private readonly model: string,
  ) {}

  /** Your components, with live data from your tools. */
  async createLive<P extends CreateLiveArtifactParams>(params: P): Promise<ArtifactResultFor<P>> {
    return this.create("live", params);
  }

  /** Your components, no data tools. */
  async createStatic<P extends CreateStaticArtifactParams>(
    params: P,
  ): Promise<ArtifactResultFor<P>> {
    reject(params, ["tools"], "Static artifacts don't run data tools; they");
    return this.create("static", params);
  }

  /** A slide deck, with built-in components. */
  async createSlides<P extends CreateSlidesParams>(params: P): Promise<ArtifactResultFor<P>> {
    reject(params, ["library", "tools", "promptOptions"], "Slides");
    return this.create("slides", params);
  }

  /** A report, with built-in components. */
  async createReport<P extends CreateReportParams>(params: P): Promise<ArtifactResultFor<P>> {
    reject(params, ["library", "tools", "promptOptions"], "Reports");
    return this.create("report", params);
  }

  /** Edits an artifact in place. Renderers keep the current version until the edit is ready. */
  async edit<P extends EditArtifactParams>(params: P): Promise<ArtifactResultFor<P>> {
    const { id, prompt, userId, library, tools, promptOptions, content, store, model, signal } =
      params;
    if (typeof id !== "string" || !id) invalidInput("id is required");
    requireUser(userId);
    if (store === false && typeof content !== "string") {
      invalidInput("With store: false, pass the artifact's saved content");
    }
    if (!library && (tools || promptOptions)) {
      invalidInput("tools and promptOptions need the artifact's library");
    }
    // OpenUI Cloud edits the version it stores; your own storage sends it along:
    // in the config for your library's artifacts, as is for slides and reports.
    const started = await this.start({
      userId,
      prompt,
      model,
      ...(library && { config: cloudConfig({ library, tools, promptOptions, content }) }),
      ...(!library && content !== undefined && { previous: content }),
      thesys: { id, ...(store !== undefined && { store }) },
      signal,
    });
    return this.result<P>(started, undefined, undefined, store);
  }

  private async create<P extends CreateParams>(
    kind: ArtifactKind,
    params: P,
  ): Promise<ArtifactResultFor<P>> {
    const {
      title,
      description,
      prompt,
      userId,
      library,
      tools,
      promptOptions,
      store,
      model,
      signal,
    } = params;
    requireUser(userId);
    const id = await this.start({
      userId,
      prompt,
      model,
      // Slides and reports use built-in libraries: no config.
      ...(library && { config: cloudConfig({ library, tools, promptOptions, title }) }),
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

  /** Mints the user's frontend token, so the artifact is theirs, and starts generating. */
  private async start({
    userId,
    prompt,
    model,
    config,
    previous,
    thesys,
    signal,
  }: GenerationInput) {
    const { token } = await this.api.post("/v1/frontend-tokens", { user_id: userId }, signal);
    if (typeof token !== "string" || !token) {
      throw new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
    }
    return this.api.generate(
      {
        model: model ?? this.model,
        stream: true,
        messages: [
          ...(config ? [{ role: "system", content: config }] : []),
          ...(previous ? [{ role: "assistant", content: previous }] : []),
          { role: "user", content: prompt },
        ],
        // Chat completions metadata values are strings.
        metadata: { thesys: JSON.stringify(thesys) },
      },
      { frontendToken: token, signal },
    );
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
      const response = await api.stream(`/v1/artifacts/${encodeURIComponent(id)}/stream`, {
        lastEventId,
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
