import type { CSSProperties } from "react";

// Light syntax theme built from the shared palette tokens, so code reads calm
// next to the UI: plain code in primary, comments and punctuation in
// secondary, and one restrained hue per token family.
const primary = "var(--openui-text-neutral-primary)";
const secondary = "var(--openui-text-neutral-secondary)";
const purple = "var(--openui-text-purple-primary)";
const green = "var(--openui-text-success-primary)";
const blue = "var(--openui-text-info-primary)";
const amber = "var(--openui-text-alert-primary)";
const pink = "var(--openui-text-pink-primary)";
const red = "var(--openui-text-danger-primary)";

const base: CSSProperties = {
  // A step darker than the app background so the block separates from it.
  background: "var(--openui-sunk)",
  color: primary,
  direction: "ltr",
  textAlign: "left",
  whiteSpace: "pre",
  wordSpacing: "normal",
  wordBreak: "normal",
  tabSize: 2,
  hyphens: "none",
};

const colors: Record<string, string[]> = {
  [secondary]: ["comment", "prolog", "cdata", "doctype", "punctuation", "operator"],
  [purple]: ["keyword", "atrule", "important", "selector"],
  [green]: ["string", "char", "attr-value", "regex", "inserted", "url"],
  [blue]: ["function", "class-name", "builtin", "property", "attr-name"],
  [amber]: ["number", "boolean", "constant", "symbol"],
  [pink]: ["tag", "variable", "entity", "namespace"],
  [red]: ["deleted"],
};

export const openuiLightTheme: Record<string, CSSProperties> = {
  // The background is translucent, so only the outer pre carries it; on the
  // inner code it would stack into a darker band behind each line.
  'code[class*="language-"]': { ...base, background: "transparent" },
  'pre[class*="language-"]': { ...base, overflow: "auto" },
  ...Object.fromEntries(
    Object.entries(colors).flatMap(([color, tokens]) => tokens.map((token) => [token, { color }])),
  ),
  comment: { color: secondary, fontStyle: "normal" },
  bold: { fontWeight: 600 },
  italic: { fontStyle: "italic" },
};
