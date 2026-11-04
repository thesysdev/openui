import { createContext } from "react";
import type { InlineMarkdownTypography } from "./InlineMarkdownRenderer";

/**
 * The typography a card gives the inline markdown a caller puts in it. CompositeCard provides
 * `"inherit"`, so its TextBlocks' bold and italic text keep the surrounding text's typography
 * without the caller passing the prop. A renderer's own `typography` prop wins. Internal: not
 * exported from the package.
 */
export const InlineTypographyContext = createContext<InlineMarkdownTypography | undefined>(
  undefined,
);
