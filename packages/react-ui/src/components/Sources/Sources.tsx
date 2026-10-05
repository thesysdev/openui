import { memo } from "react";
import { ListedSources } from "./ListedSources";
import { useCardSourceContext } from "./SourceContext";

/**
 * Renders the sources strip for the enclosing `CardSourceProvider`.
 * Returns null when there are no sources.
 */
export const Sources = memo(() => {
  const sources = useCardSourceContext();

  if (!sources.length) {
    return null;
  }
  return <ListedSources sources={sources} />;
});

Sources.displayName = "Sources";
