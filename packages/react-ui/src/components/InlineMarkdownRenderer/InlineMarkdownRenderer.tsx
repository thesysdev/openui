import clsx from "clsx";
import { memo, ReactNode } from "react";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { remarkCitations } from "../_shared/remark/remarkCitations";
import { TextContentCitation } from "../Citation";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { useTheme } from "../ThemeProvider";

const Fragment = ({ children }: { children?: ReactNode }) => children;

export interface InlineMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight markdown renderer for inline text (bold, italic, links, code).
 * Block-level elements (paragraphs, headings, lists) are flattened so the
 * output stays inline.
 */
export const InlineMarkdownRenderer = memo(
  ({ content, className }: InlineMarkdownRendererProps) => {
    const { mode } = useTheme();

    if (!content) {
      return null;
    }

    return (
      <span
        className={clsx("openui-inline-markdown-renderer", className, {
          "openui-inline-markdown-renderer--dark": mode === "dark",
        })}
      >
        <MarkDownRenderer
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
