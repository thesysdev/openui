import { isRecord, type CloudApi, type CloudQuery } from "./api";
import { OpenUIApiError, type Artifacts, type CloudArtifact } from "./types";

function invalidInput(message: string): never {
  throw new OpenUIApiError(message, "invalid_input");
}

const invalidResponse = () =>
  new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);

/** An artifact as OpenUI Cloud sends it: snake_case, times in unix seconds. */
interface WireArtifact {
  id: string;
  kind: CloudArtifact["kind"];
  name?: string;
  content: string;
  version?: string;
  pinned: boolean;
  conversation_id?: string;
  user_id?: string;
  app_id?: string;
  created_at: number;
  updated_at?: number;
}

function toArtifact(row: unknown): CloudArtifact {
  if (!isRecord(row) || typeof row["id"] !== "string") throw invalidResponse();
  const wire = row as unknown as WireArtifact;
  return {
    id: wire.id,
    kind: wire.kind,
    ...(wire.name !== undefined && { name: wire.name }),
    content: wire.content,
    ...(wire.version !== undefined && { version: wire.version }),
    pinned: wire.pinned,
    ...(wire.conversation_id !== undefined && { conversationId: wire.conversation_id }),
    ...(wire.user_id !== undefined && { userId: wire.user_id }),
    ...(wire.app_id !== undefined && { appId: wire.app_id }),
    createdAt: wire.created_at * 1000,
    ...(wire.updated_at !== undefined && { updatedAt: wire.updated_at * 1000 }),
  };
}

function artifactPath(id: unknown, action = ""): string {
  if (typeof id !== "string" || !id) invalidInput("id is required");
  return `/v1/artifacts/${encodeURIComponent(id)}${action}`;
}

/** The artifacts behind `openui.artifacts`. */
export function createArtifacts(api: CloudApi): Artifacts {
  // Acting as a user names them, in the client's app if it has one, as their frontend token would.
  // Without a user it's the org, which has no app.
  function actAs(userId: unknown): CloudQuery {
    if (userId === undefined) return {};
    if (typeof userId !== "string" || !userId.trim()) {
      invalidInput("userId must be a non-empty string: take it from your authenticated session");
    }
    return { user_id: userId, ...(api.appId !== undefined && { app_id: api.appId }) };
  }

  async function setPinned(
    id: string,
    action: "/pin" | "/unpin",
    { userId, signal }: { userId?: unknown; signal?: AbortSignal } = {},
  ): Promise<CloudArtifact> {
    if (userId === undefined) invalidInput("userId is required: each user pins their own");
    const row = await api.send("POST", artifactPath(id, action), { query: actAs(userId), signal });
    return toArtifact(row);
  }

  return {
    async list(params = {}) {
      const { userId, signal, kind, name, pinned, conversationId, limit, after, before, order } =
        params;
      const page = await api.send("GET", "/v1/artifacts", {
        query: {
          ...actAs(userId),
          kind,
          name,
          pinned: pinned === undefined ? undefined : String(pinned),
          conversation_id: conversationId,
          limit: limit === undefined ? undefined : String(limit),
          after,
          before,
          order,
        },
        signal,
      });
      if (!Array.isArray(page["data"])) throw invalidResponse();
      return {
        data: page["data"].map(toArtifact),
        hasMore: page["has_more"] === true,
        ...(typeof page["first_id"] === "string" && { firstId: page["first_id"] }),
        ...(typeof page["last_id"] === "string" && { lastId: page["last_id"] }),
      };
    },

    async get(id, { userId, signal } = {}) {
      return toArtifact(await api.send("GET", artifactPath(id), { query: actAs(userId), signal }));
    },

    // A program is a new version, which OpenUI Cloud numbers; a name alone renames it.
    async update(id, { name, content }, { userId, signal } = {}) {
      const row = await api.send("POST", artifactPath(id), {
        query: actAs(userId),
        body: { name, content },
        signal,
      });
      return toArtifact(row);
    },

    async delete(id, { userId, signal } = {}) {
      await api.send("DELETE", artifactPath(id), { query: actAs(userId), signal });
    },

    pin: (id, options) => setPinned(id, "/pin", options),
    unpin: (id, options) => setPinned(id, "/unpin", options),
  };
}
