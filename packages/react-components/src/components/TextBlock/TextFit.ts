import { createContext } from "react";
import type { TextBlockAlign, TextBlockOverflow, TextBlockWidth } from "./TextBlock";

/**
 * How a card slot fits the text a caller puts in it. SnippetCardBlock provides it for its left and
 * right slots, so the TextBlock, IconText and ImageText inside them truncate, fill or align without
 * the caller passing the props. A component's own props win. Internal: not exported from the
 * package.
 */
export const TextFitContext = createContext<{
  overflow?: TextBlockOverflow;
  width?: TextBlockWidth;
  align?: TextBlockAlign;
}>({});
