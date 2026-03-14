/**
 * Per-artifact metadata stored in the registry.
 *
 * @category Types
 */
export type ArtifactMeta = {
  /** Unique identifier for this artifact, matching the key in the registry. */
  id: string;
  /** Optional display title shown in the panel header. */
  title?: string;
  /** Timestamp (ms since epoch) of the last activation via `openArtifact`. */
  activatedAt: number;
};

/**
 * Consumer-provided metadata when opening or updating an artifact.
 * Store-managed fields (`id`, `activatedAt`) are excluded -- the store sets them automatically.
 */
export type ArtifactMetaInput = {
  /** Display title for the artifact. Merged into existing metadata on open/update. */
  title?: string;
};

/**
 * Read-only state slice for the artifact system.
 *
 * @category Types
 */
export type ArtifactState = {
  /** The currently displayed artifact, or `null` if the panel is collapsed. */
  activeArtifactId: string | null;
  /**
   * Registry of all known artifacts and their metadata, keyed by artifact ID.
   *
   * Multiple `useArtifact(id)` hooks coexist in the component tree (e.g., one
   * per chat message). Only one artifact is active at a time (`activeArtifactId`),
   * but the registry preserves metadata across close/reopen cycles so that
   * titles and other properties survive deactivation.
   *
   * Mental model: tabs in a browser -- many exist, one is selected.
   */
  artifacts: Record<string, ArtifactMeta>;
};

/**
 * Actions for managing artifacts in the store.
 *
 * @category Types
 */
export type ArtifactActions = {
  /**
   * Activates an artifact by ID. If the artifact already exists in the store,
   * its metadata is preserved and merged with any new `meta` provided.
   * If it is already the active artifact, only metadata is merged (no re-activation).
   */
  openArtifact: (id: string, meta?: ArtifactMetaInput) => void;
  /**
   * Deactivates the artifact without removing it from the registry.
   * If this is the active artifact, `activeArtifactId` is set to `null`.
   * Metadata is preserved so a subsequent `openArtifact(id)` restores it.
   *
   * Use `closeArtifact` when the user dismisses the panel (they may reopen it).
   * Use `removeArtifact` when the artifact itself is deleted (e.g., message removed).
   */
  closeArtifact: (id: string) => void;
  /**
   * Removes the artifact entry from the registry entirely, destroying its metadata.
   * If the removed artifact was active, `activeArtifactId` is set to `null`.
   *
   * Use `removeArtifact` when the artifact's source is gone (e.g., message deleted).
   * Use `closeArtifact` to hide the panel while keeping metadata for later reuse.
   */
  removeArtifact: (id: string) => void;
  /**
   * Clears all artifact entries and resets `activeArtifactId` to `null`.
   * Called automatically on thread switch.
   */
  resetArtifacts: () => void;
};

/**
 * Internal implementation details — not part of the public API.
 *
 * @internal
 */
export type ArtifactInternals = {
  /** @internal */
  _artifactPanelNode: HTMLElement | null;
  /** @internal */
  _setArtifactPanelNode: (node: HTMLElement | null) => void;
};

/** Combined artifact store type (state + actions + internals). */
export type ArtifactStore = ArtifactState & ArtifactActions & ArtifactInternals;
