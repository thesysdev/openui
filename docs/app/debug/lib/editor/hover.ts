import type { Extension } from "@codemirror/state";
import { hoverTooltip } from "@codemirror/view";

interface PropSchema {
  type?: string | string[];
  enum?: unknown[];
  items?: PropSchema;
  anyOf?: PropSchema[];
  oneOf?: PropSchema[];
  $ref?: string;
  description?: string;
}

interface ComponentDef {
  properties?: Record<string, PropSchema>;
  required?: string[];
  description?: string;
}

export type ComponentDefs = Record<string, ComponentDef>;

function typeLabel(prop: PropSchema | undefined): string {
  if (!prop) return "any";
  if (prop.$ref) return prop.$ref.split("/").pop() ?? "any";
  if (prop.enum) {
    const shown = prop.enum.slice(0, 4).map((v) => JSON.stringify(v));
    if (prop.enum.length > 4) shown.push("…");
    return shown.join(" | ");
  }
  const variants = prop.anyOf ?? prop.oneOf;
  if (variants) return variants.map(typeLabel).join(" | ");
  if (prop.type === "array") {
    const inner = typeLabel(prop.items);
    return inner === "any" ? "any[]" : `${inner}[]`;
  }
  if (Array.isArray(prop.type)) return prop.type.join(" | ");
  return prop.type ?? "any";
}

/**
 * VSCode-style hover: over a Capitalized component name, show its signature
 * (props in positional order, `?` for optional) from the active library's
 * JSON schema. `getDefs` is read at hover time so the extension doesn't need
 * rebuilding when the library changes.
 */
export function componentHoverTooltip(getDefs: () => ComponentDefs | null): Extension {
  return hoverTooltip((view, pos) => {
    const line = view.state.doc.lineAt(pos);
    let start = pos;
    let end = pos;
    while (start > line.from && /\w/.test(view.state.doc.sliceString(start - 1, start))) start--;
    while (end < line.to && /\w/.test(view.state.doc.sliceString(end, end + 1))) end++;
    if (start === end) return null;

    const word = view.state.doc.sliceString(start, end);
    if (!/^[A-Z]/.test(word)) return null;
    const def = getDefs()?.[word];
    if (!def?.properties) return null;

    const required = new Set(def.required ?? []);
    const args = Object.entries(def.properties).map(
      ([name, prop]) => `${name}${required.has(name) ? "" : "?"}: ${typeLabel(prop)}`,
    );

    return {
      pos: start,
      end,
      above: true,
      create() {
        const dom = document.createElement("div");
        dom.className = "cm-signature-tooltip";

        const sig = document.createElement("div");
        sig.className = "cm-signature-code";
        sig.textContent = `${word}(${args.join(", ")})`;
        dom.appendChild(sig);

        if (def.description) {
          const doc = document.createElement("div");
          doc.className = "cm-signature-doc";
          doc.textContent = def.description;
          dom.appendChild(doc);
        }
        return { dom };
      },
    };
  });
}
