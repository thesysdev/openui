import type {
  Artifact,
  ArtifactListParams,
  ArtifactStorage,
  ArtifactStreamEvent,
  ArtifactStreamOptions,
  ArtifactSummary,
} from "../adapters/types";
import { readSse } from "./sse";
import { cloudRequest, nextCursorOf, type CloudArtifact, type CloudListEnvelope } from "./wire";

const STREAM_EVENT_TYPES = new Set(["reference", "delta", "end", "error"]);

function parseJson(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export interface CloudArtifactStorageOptions {
  /** OpenUI Cloud API origin, e.g. "http://localhost:3102". */
  baseUrl: string;
  /** The token-injecting fetch from createFctFetch. */
  fetch: typeof fetch;
  /** Default page size when the caller passes no limit. */
  pageLimit?: number;
  /**
   * Dashboards show each query's last result while it reloads; the results are
   * kept in OpenUI Cloud for 24 hours, per user. `false` turns this off. Default true.
   */
  cacheQueryResults?: boolean;
}

function toSummary(artifact: CloudArtifact): ArtifactSummary {
  return {
    id: artifact.id,
    title: artifact.name ?? artifact.id,
    type: artifact.kind,
    threadId: artifact.conversation_id ?? "",
    updatedAt: (artifact.updated_at ?? artifact.created_at) * 1000,
    ...(artifact.pinned !== undefined && { pinned: artifact.pinned }),
  };
}

export function cloudArtifactStorage({
  baseUrl,
  fetch: fetchImpl,
  pageLimit = 100,
  cacheQueryResults = true,
}: CloudArtifactStorageOptions): ArtifactStorage {
  const request = cloudRequest(fetchImpl, baseUrl);
  const base = baseUrl.replace(/\/+$/, "");

  return {
    /** GET /v1/artifacts?[name=][kind=…]&limit[&after=]. Omitting the
     *  conversation scope lists across conversations, token-scoped to the user. */
    async list(params?: ArtifactListParams) {
      const query = new URLSearchParams();
      if (params?.name !== undefined && params.name !== "") query.set("name", params.name);
      for (const type of params?.type ?? []) query.append("kind", type);
      if (params?.pinned !== undefined) query.set("pinned", String(params.pinned));
      if (params?.order !== undefined) query.set("order", params.order);
      if (params?.cursor !== undefined) query.set("after", params.cursor);
      query.set("limit", String(params?.limit ?? pageLimit));
      const res = await request(`/v1/artifacts?${query.toString()}`);
      const envelope = (await res.json()) as CloudListEnvelope<CloudArtifact>;
      return {
        artifacts: envelope.data.map(toSummary),
        nextCursor: nextCursorOf(envelope),
      };
    },

    /** GET /v1/artifacts/:id → the stored openui-lang program (bare program;
     *  the renderer's parser sniffs the `root = …` root). */
    async get(id: string): Promise<Artifact> {
      const res = await request(`/v1/artifacts/${encodeURIComponent(id)}`);
      const artifact = (await res.json()) as CloudArtifact;
      return { ...toSummary(artifact), content: artifact.content };
    },

    /** POST /v1/artifacts/:id {content?, name?}. New content (the edited inner program) is a
     *  new version, which the server bumps; a title alone renames it. */
    async update(patch: {
      id: string;
      content?: unknown;
      title?: string;
    }): Promise<ArtifactSummary> {
      const body = {
        ...(patch.content !== undefined && {
          content:
            typeof patch.content === "string" ? patch.content : JSON.stringify(patch.content),
        }),
        ...(patch.title !== undefined && { name: patch.title }),
      };
      const res = await request(`/v1/artifacts/${encodeURIComponent(patch.id)}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return toSummary((await res.json()) as CloudArtifact);
    },

    /** POST /v1/artifacts/:id/pin. */
    async pin(id: string): Promise<ArtifactSummary> {
      const res = await request(`/v1/artifacts/${encodeURIComponent(id)}/pin`, { method: "POST" });
      return toSummary((await res.json()) as CloudArtifact);
    },

    /** POST /v1/artifacts/:id/unpin. */
    async unpin(id: string): Promise<ArtifactSummary> {
      const res = await request(`/v1/artifacts/${encodeURIComponent(id)}/unpin`, {
        method: "POST",
      });
      return toSummary((await res.json()) as CloudArtifact);
    },

    /** DELETE /v1/artifacts/:id. */
    async delete(id: string): Promise<void> {
      await request(`/v1/artifacts/${encodeURIComponent(id)}`, { method: "DELETE" });
    },

    ...(cacheQueryResults && {
      /** GET /v1/artifacts/:id/query-results. */
      async getQueryResults(id: string) {
        const res = await request(`/v1/artifacts/${encodeURIComponent(id)}/query-results`);
        const body = (await res.json()) as { version?: string; results?: Record<string, unknown> };
        return { version: body.version, results: body.results ?? {} };
      },

      /** PUT /v1/artifacts/:id/query-results {version, results}. Not awaited; a failure is dropped. */
      putQueryResults(
        id: string,
        snapshot: { version: string; results: Record<string, unknown> },
      ): void {
        request(`/v1/artifacts/${encodeURIComponent(id)}/query-results`, {
          method: "PUT",
          body: JSON.stringify(snapshot),
        }).catch(() => {});
      },
    }),

    /** GET /v1/artifacts/:id/stream (SSE). Replays a finished artifact the
     *  same way; every connection starts from the whole program. */
    async *stream(
      id: string,
      options?: ArtifactStreamOptions,
    ): AsyncGenerator<ArtifactStreamEvent> {
      const res = await fetchImpl(`${base}/v1/artifacts/${encodeURIComponent(id)}/stream`, {
        headers: { Accept: "text/event-stream" },
        signal: options?.signal,
      });
      if (res.status === 404) {
        yield {
          type: "error",
          data: { code: "not-found", message: "This artifact was deleted, or you can't see it." },
        };
        return;
      }
      // A 401 already got a fresh token (createFctFetch); retrying won't change either.
      if (res.status === 401 || res.status === 403) {
        yield {
          type: "error",
          data: {
            code: "unauthorized",
            message: "Your session expired, or you can't see this artifact.",
          },
        };
        return;
      }
      if (!res.ok || !res.body) {
        throw new Error(`OpenUI Cloud: stream ${id} failed: ${res.status} ${res.statusText}`);
      }
      for await (const message of readSse(res.body)) {
        if (!STREAM_EVENT_TYPES.has(message.event)) continue;
        yield {
          type: message.event,
          data: parseJson(message.data),
        } as ArtifactStreamEvent;
      }
    },
  };
}
