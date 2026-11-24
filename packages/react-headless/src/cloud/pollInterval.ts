import { createContext, useContext } from "react";

/** @internal Set by `OpenUICloudProvider`'s `pollInterval`. */
export const ArtifactPollIntervalContext = createContext<number | false | undefined>(undefined);

/**
 * How often open artifacts check for changes, as set on `OpenUICloudProvider`.
 * Undefined when it doesn't say.
 *
 * @internal Used by the `@openuidev/react-ui/cloud` renderers.
 */
export const useArtifactPollInterval = (): number | false | undefined =>
  useContext(ArtifactPollIntervalContext);
