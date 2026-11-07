import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import katex from "katex";
import { remarkCitations } from "upstream:citations";
import { safeUrl } from "upstream:safe-url";

function processor(mode) {
  let value = unified().use(remarkParse);
  if (mode !== "markdown") value = value.use(remarkGfm, { singleTilde: false }).use(remarkCitations);
  if (mode === "textContent") value = value.use(remarkMath, { singleDollarTextMath: false });
  if (mode !== "markdown") value = value.use(remarkBreaks);
  return value.use(remarkStringify);
}

export function prepare(text, mode, sources = [], appearance = {}) {
  const parser = processor(mode);
  const tree = parser.runSync(parser.parse(text));
  function transform(node) {
    if (node.type === "math" || node.type === "inlineMath" || (mode === "textContent" && node.type === "code" && node.lang === "math")) {
      const display = node.type !== "inlineMath";
      const image = { type: "image", alt: node.value, url: "openui-math://equation?value=" + encodeURIComponent(JSON.stringify({ tex: node.value, display })) + "&appearance=" + encodeURIComponent(JSON.stringify(appearance)) };
      return display ? { type: "paragraph", children: [image] } : image;
    }
    if (node.type === "customComponent") {
      const indices = (node.data?.hProperties?.["data-citation-indices"] ?? "").split(",").map(Number)
        .filter((index) => sources[index - 1]?.title?.trim() && sources[index - 1]?.sourceName?.trim());
      return indices.length ? {
        type: "link", url: "openui-citation://sources/" + indices.join(","),
        children: [{ type: "text", value: "[" + indices.join(", ") + "]" }],
      } : { type: "text", value: "" };
    }
    if (node.children) node.children = node.children.map(transform);
    return node;
  }
  transform(tree);
  if (mode === "inline") {
    function flatten(node) {
      if (["root", "paragraph", "heading", "list", "listItem"].includes(node.type)) {
        return (node.children ?? []).flatMap(flatten);
      }
      return [node];
    }
    const children = [];
    let inlines = [];
    const flush = () => { if (inlines.length) children.push({ type: "paragraph", children: inlines }); inlines = []; };
    for (const node of flatten(tree)) {
      if (["code", "blockquote", "table", "thematicBreak", "html"].includes(node.type)) { flush(); children.push(node); }
      else inlines.push(node);
    }
    flush();
    tree.children = children;
  }
  return parser.stringify(tree);
}

export function math(tex, display) {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, trust: false, macros: {} });
}

export function sourceURL(value) {
  return safeUrl(value) ?? null;
}
