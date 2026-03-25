/**
 * Read-only state slice for the artifact system.
 *
 * @category Types
 */
export type ArtifactState = {
  /** The currently displayed artifact, or `null` if the panel is collapsed. */
  activeArtifactId: string | null;
};

/**
 * Actions for managing artifacts in the store.
 *
 * @category Types
 */
export type ArtifactActions = {
  /** Activates an artifact by ID. */
  openArtifact: (id: string) => void;
  /**
   * Deactivates the artifact if it is the currently active one.
   * No-op if `id` does not match `activeArtifactId`.
   */
  closeArtifact: (id: string) => void;
  /**
   * Resets `activeArtifactId` to `null`.
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
