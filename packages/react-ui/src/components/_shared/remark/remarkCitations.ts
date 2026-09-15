/**
 * # remarkCitations
 *
 * Remark plugin that transforms citation patterns like [1][2] into custom React components.
 * Scans markdown text nodes, splits them into text and citation parts, and converts
 * citations to span elements with data attributes for TextContentCitation to render.
 *
 * **How it works:**
 * 1. Uses regex `/(\[\d+\]\s*)+/g` to find citation patterns
 * 2. Splits text nodes: text before → citation component → text after
 * 3. Creates span nodes with `data-component-type="citation"` and `data-citation-indices="1,2"`
 * 4. Replaces original text node with split parts in the AST
 *
 * **Example:**
 * Input: "Statement [1][2] text" → Output: [Text, Citation(1,2), Text]
 */

import { visit } from "unist-util-visit";

/**
 * Regex to match citation patterns like [1], [1][2], [1] [2]
 * Matches one or more [number] patterns with optional whitespace
 */
const customComponentRegex = /(\[\d+\]\s*)+/g;

/**
 * Regex to extract individual numbers from citation brackets
 * Example: "[1][2]" → ["1", "2"]
 */
const numberExtractorRegex = /\[(\d+)\]/g;

/**
 * Remark plugin that transforms citation patterns into custom component nodes.
 * Returns a function that processes the markdown AST tree.
 */
export const remarkCitations = () => {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string") {
        return;
      }

      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = customComponentRegex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index),
          });
        }

        const fullMatch = match[0];
        const numbers: string[] = [];
        let numberMatch;

        while ((numberMatch = numberExtractorRegex.exec(fullMatch)) !== null) {
          numbers.push(numberMatch[1] ?? "");
        }
        numberExtractorRegex.lastIndex = 0;

        if (numbers.length > 0) {
          parts.push({
            type: "customComponent",
            data: {
              hName: "span",
              hProperties: {
                "data-component-type": "citation",
                "data-citation-indices": numbers.join(","),
              },
            },
            children: [{ type: "text", value: fullMatch.trim() }],
          });
        }

        lastIndex = match.index + fullMatch.length;
      }
      customComponentRegex.lastIndex = 0;

      if (lastIndex < node.value.length) {
        parts.push({ type: "text", value: node.value.slice(lastIndex) });
      }

      if (parts.length > 0 && parent && typeof index === "number") {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }

      return undefined;
    });
  };
};
