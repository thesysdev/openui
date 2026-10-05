/**
 * # TextContentCitation
 *
 * Renders inline citations in markdown text. Converts citation markers like [1][2]
 * into interactive Citation components that link to source URLs.
 *
 * **How it works:**
 * 1. Detects spans with `data-component-type="citation"` and `data-citation-indices="1,2"`
 * 2. Looks up sources from CardSourceContext using citation indices (converts 1-indexed to 0-indexed)
 * 3. Filters to only include sources with valid titles/names
 * 4. Renders Citation component, or returns null if no valid sources
 *
 * Wired in as the `span` component of markdown renderers together with the
 * `remarkCitations` plugin - typically not called directly.
 */

import { HTMLAttributes, ReactNode } from "react";
import { SourceWithFavicon, useCardSourceContext } from "../Sources/SourceContext";
import { Citation } from "./Citation";

export type TextContentCitationProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  node?: { properties?: Record<string, unknown> };
  children?: ReactNode;
};

export const TextContentCitation = ({ node, children, ...rest }: TextContentCitationProps) => {
  const sources = useCardSourceContext();
  const properties = node?.properties ?? {};
  const componentType = properties["data-component-type"];
  const indicesString = properties["data-citation-indices"] as string | undefined;

  if (componentType !== "citation" || !indicesString) {
    return <span {...rest}>{children}</span>;
  }

  if (!sources.length) {
    return null;
  }

  const indices = indicesString.split(",").map(Number);
  const relevantSources = indices
    .map((idx) => sources[idx - 1])
    .filter((source): source is SourceWithFavicon => source !== undefined)
    .filter(
      (source) =>
        source.sourceName &&
        source.title &&
        source.sourceName.trim() !== "" &&
        source.title.trim() !== "",
    );

  if (relevantSources.length === 0) {
    return null;
  }

  return <Citation sources={relevantSources} />;
};
