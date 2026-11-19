"use client";

import clsx from "clsx";
import { memo, useEffect, useState } from "react";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { remarkCitations } from "../_shared/remark/remarkCitations";
import { TextContentCitation } from "../Citation";
import { InlineHeader } from "../InlineHeader";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { useTheme } from "../ThemeProvider";
import { names, textContentWrapperStyles } from "./textContentWrapper.styles";

export interface TextContentWrapperProps {
  textMarkdown: string;
  header?: { heading: string; description?: string };
  variant?: "clear" | "card" | "sunk";
  className?: string;
}

// rehype-katex is loaded dynamically (and only on the client) because it
// transitively pulls in `hast-util-from-html-isomorphic`, which calls
// `new DOMParser()` at module load. On Node (Next.js SSR, build-time
// prerender) DOMParser is undefined and the page 500s before any of our
// own code runs. Initial SSR pass renders math as raw `$…$` text; after
// hydration the plugin loads and the next render replaces it with the
// rendered KaTeX. Acceptable trade-off vs. switching markdown stacks.
type RehypePlugin = NonNullable<
  Parameters<typeof MarkDownRenderer>[0]["options"]
>["rehypePlugins"] extends Array<infer T> | undefined
  ? T
  : never;

/**
 * Full-featured markdown block for chat responses: GFM, math (KaTeX),
 * line breaks, and inline `[n]` citations resolved against the enclosing
 * `CardSourceProvider`.
 */
export const TextContentWrapper = memo((props: TextContentWrapperProps) => {
  const styles = textContentWrapperStyles;
  const { mode } = useTheme();
  const [rehypeKatex, setRehypeKatex] = useState<RehypePlugin | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("./mathRenderer").then((m) => {
      if (!cancelled) setRehypeKatex(() => m.default as RehypePlugin);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={clsx(
        styles.root,
        names.root,
        names.variant[props.variant ?? "clear"],
        props.className,
      )}
      data-mode={mode}
    >
      {props.header && (
        <InlineHeader heading={props.header.heading} description={props.header.description} />
      )}
      <MarkDownRenderer
        textMarkdown={props.textMarkdown}
        variant={props.variant}
        listLeadIn="spaced"
        options={{
          remarkPlugins: [
            // singleTilde: false → only ~~double tildes~~ render as strikethrough.
            // A lone ~ (e.g. "~$886K" meaning "approximately") stays literal instead
            // of being parsed as a strikethrough delimiter, which otherwise strikes
            // through everything between two such tildes in a sentence.
            [remarkGfm, { singleTilde: false }],
            [remarkMath, { singleDollarTextMath: false }],
            [remarkBreaks, { breaks: true }],
            remarkCitations,
          ],
          rehypePlugins: rehypeKatex ? [rehypeKatex] : [],
          components: {
            span: ({ node, className, ...rest }) => (
              <TextContentCitation
                node={node}
                {...rest}
                className={clsx(
                  className,
                  className?.split(" ").includes("katex") && [styles.math, names.math],
                )}
              />
            ),
          },
        }}
        className={names.markdown}
      />
    </div>
  );
});

TextContentWrapper.displayName = "TextContentWrapper";
