import { readSSE } from "../shared/sse";
import { toToolDefinitions } from "../tools/execute";
import { isRecord, type CloudApi } from "./api";
import {
  OpenUIApiError,
  type ArtifactError,
  type ArtifactLibrary,
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
};

const MAX_RECONNECTS = 3;
const ERROR_CODES = new Set<string>(["not-found", "generation-failed", "network-error"]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function invalidInput(message: string): never {
  throw new OpenUIApiError(message, "invalid_input");
}

// Type-checked callers can't pass these; plain JavaScript callers can.
function reject(params: object, keys: Array<"library" | "tools">, kind: string): void {
  for (const key of keys) {
    if ((params as Record<string, unknown>)[key] !== undefined) {
      invalidInput(
        `${kind} use built-in ${key === "library" ? "components" : "data"}: remove \`${key}\``,
      );
    }
  }
}

function requireUser(userId: unknown): void {
  if (typeof userId !== "string" || !userId.trim()) {
    invalidInput("userId is required: take it from your authenticated session");
  }
}

/** Create and edit artifacts. Each call returns as soon as the artifact has an id. */
export class Artifacts {
  constructor(private readonly api: CloudApi) {}

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
    reject(params, ["library", "tools"], "Slides");
    return this.create("slides", params);
  }

  /** A report, with built-in components. */
  async createReport<P extends CreateReportParams>(params: P): Promise<ArtifactResultFor<P>> {
    reject(params, ["library", "tools"], "Reports");
    return this.create("report", params);
  }

  /** Edits an artifact in place. Renderers keep the current version until the edit is ready. */
  async edit<P extends EditArtifactParams>(params: P): Promise<ArtifactResultFor<P>> {
    const { id, prompt, userId, library, tools, content, store, signal } = params;
    if (typeof id !== "string" || !id) invalidInput("id is required");
    requireUser(userId);
    if (store === false && typeof content !== "string") {
      invalidInput("With store: false, pass the artifact's saved content");
    }
    const response = await this.api.post(
      `/v1/artifacts/${encodeURIComponent(id)}/edit`,
      {
        prompt,
        user_id: userId,
        ...(library && { library: library.toSpec() }),
        ...(tools && { tools: toToolDefinitions(tools) }),
        ...(content !== undefined && { content }),
        ...(store !== undefined && { store }),
      },
      signal,
    );
    return this.result<P>(response, store);
  }

  private async create<P extends CreateParams>(
    kind: ArtifactKind,
    params: P,
  ): Promise<ArtifactResultFor<P>> {
    const { title, description, prompt, userId, library, tools, store, signal } = params;
    requireUser(userId);
    const response = await this.api.post(
      "/v1/artifacts",
      {
        kind,
        title,
        ...(description !== undefined && { description }),
        prompt,
        user_id: userId,
        ...(library && { library: library.toSpec() }),
        ...(tools && { tools: toToolDefinitions(tools) }),
        ...(store !== undefined && { store }),
      },
      signal,
    );
    return this.result<P>(response, store);
  }

  private result<P>(response: Record<string, unknown>, store?: boolean): ArtifactResultFor<P> {
    const id = response["id"];
    const toolResponse = response["tool_response"];
    if (typeof id !== "string" || !id || typeof toolResponse !== "string") {
      throw new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
    }
    const result: ArtifactResult = { id, toolResponse };
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
