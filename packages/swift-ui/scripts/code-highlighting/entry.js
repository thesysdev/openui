import { refractor } from "refractor/all";

// react-syntax-highlighter's Prism renderer uses this same refractor version.
// Return tokens for native Text; no generated HTML or WebView is involved.
export function highlight(code, language) {
  if (!language || !refractor.registered(language)) return [{ text: code, types: [] }];
  const output = [];
  function visit(node, inherited = []) {
    if (node.type === "text") {
      output.push({ text: node.value, types: inherited });
      return;
    }
    const types = [...inherited, ...(node.properties?.className ?? []).filter((value) => value !== "token")];
    for (const child of node.children ?? []) visit(child, types);
  }
  try {
    visit(refractor.highlight(code, language));
    return output;
  } catch {
    return [{ text: code, types: [] }];
  }
}

export function languages() {
  return refractor.listLanguages();
}
