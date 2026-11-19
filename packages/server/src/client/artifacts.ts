import { isIdList } from "../tools/types";
import { isRecord, type CloudApi, type CloudQuery } from "./api";
import {
  OpenUIApiError,
  type ArtifactRequestOptions,
  type ArtifactShareTarget,
  type Artifacts,
  type CloudArtifact,
  type CloudArtifactShare,
} from "./types";

function invalidInput(message: string): never {
  throw new OpenUIApiError(message, "invalid_input");
}

const invalidResponse = () =>
  new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);

/** A share as OpenUI Cloud sends it: snake_case, times in unix seconds. */
interface WireShare {
  type: CloudArtifactShare["type"];
  id: string;
  access: CloudArtifactShare["access"];
  created_by: string;
  created_at: number;
}

/** An artifact as OpenUI Cloud sends it: snake_case, times in unix seconds. */
interface WireArtifact {
  id: string;
  kind: CloudArtifact["kind"];
  name?: string;
  content: string;
  version?: string;
  pinned: boolean;
  is_owner?: boolean;
  is_editable?: boolean;
  shares?: WireShare[];
  conversation_id?: string;
  user_id?: string;
  app_id?: string;
  created_at: number;
  updated_at?: number;
}

const toShare = (share: WireShare): CloudArtifactShare => ({
  type: share.type,
  id: share.id,
  access: share.access,
  createdBy: share.created_by,
  createdAt: share.created_at * 1000,
});

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
    isOwner: wire.is_owner === true,
    isEditable: wire.is_editable === true,
    ...(Array.isArray(wire.shares) && { shares: wire.shares.map(toShare) }),
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

// Checked here: OpenUI Cloud's own check doesn't say which field is wrong.
function shareTarget(target: Partial<ArtifactShareTarget> | undefined): ArtifactShareTarget {
  const { type, id } = target ?? {};
  if ((type !== "user" && type !== "group") || typeof id !== "string" || !id) {
    invalidInput('A share target is { type: "user" | "group", id }');
  }
  return { type, id };
}

/** The artifacts behind `openui.artifacts`. */
export function createArtifacts(api: CloudApi): Artifacts {
  // Acting as a user names them and their groups, in the client's app if it has one, as their
  // frontend token would. Without a user it's the org, which has no app or groups.
  function actAs({ userId, groupIds }: ArtifactRequestOptions = {}): CloudQuery {
    if (userId === undefined) {
      if (groupIds !== undefined) invalidInput("groupIds needs userId: they're that user's groups");
      return {};
    }
    if (typeof userId !== "string" || !userId.trim()) {
      invalidInput("userId must be a non-empty string: take it from your authenticated session");
    }
    if (groupIds !== undefined && !isIdList(groupIds)) {
      invalidInput("groupIds must be an array of non-empty strings");
    }
    return {
      user_id: userId,
      ...(groupIds?.length && { group_ids: groupIds }),
      ...(api.appId !== undefined && { app_id: api.appId }),
    };
  }

  const callAs = (options: ArtifactRequestOptions = {}) => ({
    query: actAs(options),
    signal: options.signal,
  });

  async function setPinned(
    id: string,
    action: "/pin" | "/unpin",
    options: ArtifactRequestOptions = {},
  ): Promise<CloudArtifact> {
    if (options.userId === undefined) invalidInput("userId is required: each user pins their own");
    return toArtifact(await api.send("POST", artifactPath(id, action), callAs(options)));
  }

  return {
    async list(params = {}) {
      const { kind, name, pinned, isOwner, conversationId, limit, after, before, order } = params;
      const page = await api.send("GET", "/v1/artifacts", {
        query: {
          ...actAs(params),
          kind,
          name,
          pinned: pinned === undefined ? undefined : String(pinned),
          is_owner: isOwner === undefined ? undefined : String(isOwner),
          conversation_id: conversationId,
          limit: limit === undefined ? undefined : String(limit),
          after,
          before,
          order,
        },
        signal: params.signal,
      });
      if (!Array.isArray(page["data"])) throw invalidResponse();
      return {
        data: page["data"].map(toArtifact),
        hasMore: page["has_more"] === true,
        ...(typeof page["first_id"] === "string" && { firstId: page["first_id"] }),
        ...(typeof page["last_id"] === "string" && { lastId: page["last_id"] }),
      };
    },

    async get(id, options) {
      return toArtifact(await api.send("GET", artifactPath(id), callAs(options)));
    },

    // A program is a new version, which OpenUI Cloud numbers; a name alone renames it.
    async update(id, { name, content }, options) {
      const body = { name, content };
      return toArtifact(await api.send("POST", artifactPath(id), { ...callAs(options), body }));
    },

    async delete(id, options) {
      await api.send("DELETE", artifactPath(id), callAs(options));
    },

    pin: (id, options) => setPinned(id, "/pin", options),
    unpin: (id, options) => setPinned(id, "/unpin", options),

    async share(id, params, options) {
      const access = params?.access;
      if (access !== "view" && access !== "edit") invalidInput('access must be "view" or "edit"');
      const body = { ...shareTarget(params), access };
      return toArtifact(
        await api.send("POST", artifactPath(id, "/share"), { ...callAs(options), body }),
      );
    },

    async unshare(id, target, options) {
      const body = shareTarget(target);
      return toArtifact(
        await api.send("POST", artifactPath(id, "/unshare"), { ...callAs(options), body }),
      );
    },
  };
}
