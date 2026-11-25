import type { CloudPromptOptions, LibrarySpec } from "@openuidev/lang-core";
import type { CloudList, RequestOptions } from "../core/resource";

/**
 * The components an artifact can use, as a library spec: `library.toSpec()`, or
 * the JSON from `openui generate --spec`.
 */
export type ArtifactLibrary = LibrarySpec;

/** Extend the prompt built from your library: `examples`, `preamble`, `additionalRules`. */
export type ArtifactPromptOptions = CloudPromptOptions;

/**
 * Who an artifact call is for. Without `userId` it's your org, which sees every
 * user's artifacts. With it, the call acts as that user and gets what their
 * frontend token would.
 */
export interface ArtifactRequestOptions extends RequestOptions {
  /** The user to act as, from your session. Never take it from the browser. */
  userId?: string;
  /**
   * That user's groups, as on their frontend token, so artifacts shared with
   * those groups count too. Only with `userId`. Up to 10, each up to 64 characters.
   */
  groupIds?: string[];
}

/** Pins belong to a user, so pinning needs one. */
export type ArtifactUserOptions = ArtifactRequestOptions & { userId: string };

/** Who an artifact is shared with: one user, or one of your groups. */
export interface ArtifactShareTarget {
  type: "user" | "group";
  id: string;
}

/** `view` opens and runs it; `edit` also edits, renames and shares it. */
export interface ShareArtifactParams extends ArtifactShareTarget {
  access: "view" | "edit";
}

/** One share on an artifact. */
export interface CloudArtifactShare extends ShareArtifactParams {
  /** Who shared it: a user id, or your org id for the API key alone. */
  createdBy: string;
  /** Unix milliseconds. */
  createdAt: number;
}

/** A saved artifact. Dashboards hold only their layout: scripts stay in OpenUI Cloud. */
export interface CloudArtifact {
  id: string;
  kind: "dashboard" | "slides" | "report";
  name?: string;
  /** The openui-lang program, ready for the renderer. */
  content: string;
  version?: string;
  /** Whether the user pinned it. Always false for your org, which has no pins. */
  pinned: boolean;
  /** Whether the user made it. Always false for your org. */
  isOwner: boolean;
  /** Whether the caller can edit, rename and share it. Always true for your org. */
  isEditable: boolean;
  /** Who it's shared with. Only when `isEditable`. */
  shares?: CloudArtifactShare[];
  conversationId?: string;
  /** The user it was made for. Absent when your org made it without one. */
  userId?: string;
  /** That user's app. */
  appId?: string;
  /** Unix milliseconds. */
  createdAt: number;
  /** Unix milliseconds. */
  updatedAt?: number;
}

/** One page of artifacts, newest first unless you ask for `order: "asc"`. */
export type CloudArtifactList = CloudList<CloudArtifact>;

export interface ListArtifactsParams extends ArtifactRequestOptions {
  /** Only these kinds. */
  kind?: CloudArtifact["kind"] | CloudArtifact["kind"][];
  /** Case-insensitive match on the name. */
  name?: string;
  /** `true` for pinned artifacts only, `false` for unpinned ones. */
  pinned?: boolean;
  /** `true` for the user's own artifacts only, `false` for those shared with them. Needs `userId`. */
  isOwner?: boolean;
  /** Only the artifacts made in this conversation. */
  conversationId?: string;
  /** Page size, 1 to 100. */
  limit?: number;
  /** The page after this id: the last page's `lastId`. */
  after?: string;
  /** The page before this id: the last page's `firstId`. */
  before?: string;
  order?: "asc" | "desc";
}

export interface UpdateArtifactParams {
  /** The new name. */
  name?: string;
  /** The edited openui-lang program. Omit it to rename only. */
  content?: string;
}

/** Read and manage saved artifacts with the API key. */
export interface Artifacts {
  list(params?: ListArtifactsParams): Promise<CloudArtifactList>;
  get(id: string, options?: ArtifactRequestOptions): Promise<CloudArtifact>;
  update(
    id: string,
    params: UpdateArtifactParams,
    options?: ArtifactRequestOptions,
  ): Promise<CloudArtifact>;
  /** Deleted artifacts can't be restored. */
  delete(id: string, options?: ArtifactRequestOptions): Promise<void>;
  pin(id: string, options: ArtifactUserOptions): Promise<CloudArtifact>;
  unpin(id: string, options: ArtifactUserOptions): Promise<CloudArtifact>;
  /** Shares it, or changes the access of a target it's already shared with. */
  share(
    id: string,
    params: ShareArtifactParams,
    options?: ArtifactRequestOptions,
  ): Promise<CloudArtifact>;
  /** Removing a share that isn't there does nothing. */
  unshare(
    id: string,
    target: ArtifactShareTarget,
    options?: ArtifactRequestOptions,
  ): Promise<CloudArtifact>;
}
