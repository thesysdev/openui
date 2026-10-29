import { createContext, useContext } from "react";
import type { ArtifactStorage } from "../adapters/types";

/** @internal Provided by `ChatProvider` from `storage.artifact`. */
export const ArtifactStorageContext = createContext<ArtifactStorage | null>(null);

/**
 * Returns the configured global {@link ArtifactStorage} channel, or `null`
 * when the storage adapter doesn't provide one.
 *
 * Renderer implementations use this to lazily fetch (`get`) or persist
 * (`update`) artifact content; the artifact browser uses it for `list`.
 *
 * @category Hooks
 */
export const useArtifactStorage = (): ArtifactStorage | null => useContext(ArtifactStorageContext);
