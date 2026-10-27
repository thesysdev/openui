import type { LibrarySpec } from "@openuidev/lang-core";
import type { ToolDefinition } from "../tools/types";

export interface OpenUIClientOptions {
  /** Defaults to the `THESYS_API_KEY` environment variable. */
  apiKey?: string;
  /** OpenUI Cloud origin, without /v1. Defaults to https://api.thesys.dev. */
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

/** The components an artifact can use, such as a library from `createLibrary`. */
export interface ArtifactLibrary {
  toSpec(): LibrarySpec;
}

/** A data tool, as you pass it to `createInterpreter`. Only what generation needs is sent, never `execute`. */
export type ArtifactTool = Omit<ToolDefinition, "name"> & { execute?: unknown };

interface CreateArtifactBase {
  /** A short title, such as "Q3 sales by region". */
  title: string;
  /** One sentence on what the artifact shows. */
  description?: string;
  /** What to build. The subagent sees only this, so include any data it needs. */
  prompt: string;
  /** The signed-in user, from your session. Users only read and edit their own artifacts. */
  userId: string;
  /**
   * `false` keeps the artifact out of OpenUI Cloud storage: the result also has
   * `done`, which resolves with the finished artifact for you to save. Default `true`.
   */
  store?: boolean;
  signal?: AbortSignal;
}

export interface CreateLiveArtifactParams extends CreateArtifactBase {
  library: ArtifactLibrary;
  tools: Record<string, ArtifactTool>;
}

export interface CreateStaticArtifactParams extends CreateArtifactBase {
  library: ArtifactLibrary;
}

export type CreateSlidesParams = CreateArtifactBase;

export type CreateReportParams = CreateArtifactBase;

interface EditArtifactBase {
  id: string;
  /** The change to make, and any data it needs. */
  prompt: string;
  userId: string;
  /** Live and static artifacts: the library they were created with. */
  library?: ArtifactLibrary;
  /** Live artifacts: the data tools they were created with. */
  tools?: Record<string, ArtifactTool>;
  signal?: AbortSignal;
}

export type EditArtifactParams =
  | (EditArtifactBase & { store?: true; content?: string })
  /** An artifact in your own storage: pass its saved `content`. */
  | (EditArtifactBase & { store: false; content: string });

export interface ArtifactResult {
  id: string;
  /** Return this from your tool as is, and pass the same string to the renderer. */
  toolResponse: string;
}

/** Why an artifact couldn't be generated. */
export interface ArtifactError {
  source: "artifact";
  code: "not-found" | "generation-failed" | "network-error";
  message: string;
}

/** A finished artifact, from `done` with `store: false`. */
export interface GeneratedArtifact {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  /** The generated artifact. Save it as is. */
  content: string;
  /** What the subagent built. If it failed, what went wrong. */
  summary?: string;
  /** Only if it failed. */
  error?: ArtifactError;
}

export interface UnstoredArtifactResult extends ArtifactResult {
  /** Resolves when generation ends, with the artifact to save. Never rejects. */
  done: Promise<GeneratedArtifact>;
}

/** `done` comes back only with `store: false`. */
export type ArtifactResultFor<Params> = Params extends { store: false }
  ? UnstoredArtifactResult
  : ArtifactResult;

/** Failures from the OpenUI Cloud API expose a stable code and the HTTP status. */
export class OpenUIApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenUIApiError";
  }
}
