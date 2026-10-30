import clsx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { MarkdownBlocks } from "./markdownBlocks";
import { names, styles } from "./markdown.styles";

export interface MarkdownProps extends HTMLAttributes<HTMLDivElement> {
  /** Markdown: headings, lists, quotes, code, rules and | tables |. */
  text: string;
}

/**
 * Prose in the kit's rhythm. The kit's own renderer, as in Open Intelligent
 * UI: react-components' MarkDownRenderer has no table support, so a | table |
 * would render as a line of pipes.
 */
const Markdown = forwardRef<HTMLDivElement, MarkdownProps>(({ text, className, ...rest }, ref) => (
  <div ref={ref} className={clsx(styles.root, names.root, className)} {...rest}>
    <MarkdownBlocks text={text} />
  </div>
));

Markdown.displayName = "Markdown";

export { Markdown };
