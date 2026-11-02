"use client";

import clsx from "clsx";
import { memo, ReactNode, useContext } from "react";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { remarkCitations } from "../_shared/remark/remarkCitations";
import { TextContentCitation } from "../Citation";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { inlineMarkdownStyles, names } from "./inlineMarkdown.styles";
import { InlineTypographyContext } from "./InlineTypography";

const Fragment = ({ children }: { children?: ReactNode }) => children;

export type InlineMarkdownTypography = "inherit";

export interface InlineMarkdownRendererProps {
  content: string;
  /**
   * `"inherit"` gives bold and italic text the surrounding text's typography, at medium weight, and
   * sets inline code at the small code size. CompositeCard sets it for the markdown in its slots;
   * omit it for the markdown renderer's own emphasis.
   */
  typography?: InlineMarkdownTypography;
  className?: string;
}

/**
 * Lightweight markdown renderer for inline text (bold, italic, links, code).
 * Block-level elements (paragraphs, headings, lists) are flattened so the
 * output stays inline.
 */
export const InlineMarkdownRenderer = memo(
  ({ content, typography: ownTypography, className }: InlineMarkdownRendererProps) => {
    // A card supplies the typography the caller leaves out.
    const cardTypography = useContext(InlineTypographyContext);
    const typography = ownTypography ?? cardTypography;
    const styles = inlineMarkdownStyles;

    if (!content) {
      return null;
    }

    return (
      <span
        className={clsx(
          styles.root,
          names.root,
          typography && names.typography[typography],
          className,
        )}
      >
        <MarkDownRenderer
          className={clsx(styles.content, names.content)}
          typography={typography}
          textMarkdown={content}
          options={{
            remarkPlugins: [
              remarkCitations,
              [remarkBreaks, { breaks: false }],
              [remarkGfm, { singleTilde: false }],
            ],
            components: {
              p: Fragment,
              h1: Fragment,
              h2: Fragment,
              h3: Fragment,
              h4: Fragment,
              h5: Fragment,
              h6: Fragment,
              ul: Fragment,
              ol: Fragment,
              li: Fragment,
              span: TextContentCitation,
            },
          }}
        />
      </span>
    );
  },
);

InlineMarkdownRenderer.displayName = "InlineMarkdownRenderer";
