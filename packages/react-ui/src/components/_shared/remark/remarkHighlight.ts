/**
 * # remarkHighlight
 *
 * Remark plugin that turns `==text==` into a `<mark>` highlight.
 *
 * Only plain text nodes are scanned, so `a == b` inside inline code or code
 * blocks is never touched. The markers must hug the text (`==key phrase==`),
 * which keeps prose like "x == y" literal. While streaming, an unclosed `==`
 * shows as plain text until its closing pair arrives, just like `**bold**`.
 *
 * **Example:**
 * Input: "You can now ==swim in the Seine==." → Output: [Text, Mark, Text]
 */

import { visit } from "unist-util-visit";

const highlightRegex = /==(?=\S)([^=\n]*?\S)==/g;

export const remarkHighlight = () => {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string" || !node.value.includes("==")) {
        return;
      }

      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = highlightRegex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: "text", value: node.value.slice(lastIndex, match.index) });
        }
        parts.push({
          type: "highlight",
          data: { hName: "mark" },
          children: [{ type: "text", value: match[1] }],
        });
        lastIndex = match.index + match[0].length;
      }
      highlightRegex.lastIndex = 0;

      if (parts.length === 0) {
        return undefined;
      }
      if (lastIndex < node.value.length) {
        parts.push({ type: "text", value: node.value.slice(lastIndex) });
      }

      if (parent && typeof index === "number") {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }

      return undefined;
    });
  };
};
