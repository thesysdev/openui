import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { ARTIFACT_ID_HEADER, FRONTEND_TOKEN_HEADER } from "../shared/constants";
import { toToolDefinitions } from "../tools/execute";
import { apiError, isRecord, type CloudApi } from "./api";
import { createFrontendToken } from "./frontend-token";
import {
  OpenUIApiError,
  type ArtifactResult,
  type ArtifactTool,
  type ArtifactToolOptions,
} from "./types";

type ArtifactKind = "live" | "static";

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
function toolResponse(id: string, kind: ArtifactKind, title?: string): string {
  const version = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const header = { artifact_id: id, type: kind, ...(title && { name: title }), version };
  const sentence =
    title === undefined
      ? `Editing the ${kind} artifact; the user sees the new version when it's ready.`
      : `Started the ${kind} artifact "${title}"; the user sees it as it's generated.`;
  return `${sentence}\n]]>openui:artifact ${JSON.stringify(header)}\n`;
}

/** The artifact tool behind `openui.defineArtifactTool`. */
export function defineArtifactTool(api: CloudApi, options: ArtifactToolOptions): ArtifactTool {
  // Type-checked callers can't get these wrong; plain JavaScript callers can.
  const { kind, library, model, promptOptions, tools } = options;
  if (kind !== "live" && kind !== "static") invalidInput('kind must be "live" or "static"');
  if (typeof model !== "string" || !model.trim()) {
    invalidInput("model is required, as `provider/model`, such as anthropic/claude-sonnet-4.6");
  }
  if (typeof library?.toSpec !== "function") {
    invalidInput("library is required, such as one from createLibrary");
  }
  if (kind === "live" && !isRecord(tools)) invalidInput("Live artifacts need `tools`");
  if (kind === "static" && tools !== undefined) {
    invalidInput("Static artifacts don't run data tools: remove `tools`");
  }

  let spec: LibrarySpec;
  try {
    spec = library.toSpec();
  } catch (error) {
    invalidLibrary(error);
  }
  const script = tools && { tools: toToolDefinitions(tools) };

  /** OpenUI Cloud's config block: your library, prompt options and data tools. */
  const config = (title?: string): string => {
    try {
      return generateSystemPrompt({
        cloud: true,
        library: spec,
        ...(promptOptions && { promptOptions }),
        ...(script && { script }),
        ...(title !== undefined && { meta: { name: title } }),
      });
    } catch (error) {
      invalidLibrary(error);
    }
  };

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
    const { token } = await createFrontendToken(api, userId, signal);
    const response = await api.request("/v1/artifact/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", [FRONTEND_TOKEN_HEADER]: token },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: config(title) },
          { role: "user", content: prompt },
        ],
        // Chat completions metadata values are strings.
        metadata: { thesys: JSON.stringify({ c1_artifact_type: kind, ...thesys }) },
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
    kind,

    async create({ userId, title, description, prompt }, { signal } = {}): Promise<ArtifactResult> {
      const thesys = { title, ...(description !== undefined && { description }) };
      const id = await start(userId, prompt, title, thesys, signal);
      return { id, toolResponse: toolResponse(id, kind, title) };
    },

    // OpenUI Cloud edits the version it stores, and checks it's this kind.
    async edit({ id, userId, prompt }, { signal } = {}): Promise<ArtifactResult> {
      if (typeof id !== "string" || !id) invalidInput("id is required");
      const edited = await start(userId, prompt, undefined, { id }, signal);
      return { id: edited, toolResponse: toolResponse(edited, kind) };
    },
  };
}
