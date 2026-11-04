import { parseMessage } from "@openuidev/lang-core";

/** Metadata emitted by OpenUI Cloud. */
export interface ResponseMetadata {
  name?: string;
}

// OpenUI Cloud writes its scripts after the program: `]]>openui:scripts {"count":1}`, then
// `[{"name":"sales_total","code":"async ({ tools }) => …"}]`. This file cuts that section out;
// parseMessage reads the rest (content, attributes, end).
const SCRIPTS = "]]>openui:scripts";
const CONTENT_LINE = /^\]\]>openui:content(?:\?.*)?\r?$(\n?)/m;
// A scripts line without its JSON would read as a message marker; keep it in the content.
const BARE_SCRIPTS = /^\]\]>openui:scripts(?=\?|\r?$)/gm;

interface Scripts {
  names: Set<string>;
  revision: string;
}

// Markers inside DSL/JSON strings are ordinary content.
function markerIndex(text: string): number {
  if (!text.includes("]]>")) return -1; // plain DSL: skip the character walk
  let quote = "";
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = "";
    } else if (c === "#" || (c === "/" && text[i + 1] === "/")) {
      const newline = text.indexOf("\n", i);
      if (newline < 0) return -1;
      i = newline;
    } else if (c === '"' || c === "'") quote = c;
    else if (text.startsWith("]]>", i)) return i;
  }
  return -1;
}

function readScripts(header: string, payload: string): Scripts | null {
  try {
    const { count } = JSON.parse(header);
    const values: unknown = JSON.parse(payload);
    if (!Array.isArray(values) || !Number.isSafeInteger(count) || count !== values.length)
      return null;
    const names = new Set<string>();
    for (const script of values) {
      if (
        !script ||
        typeof script.name !== "string" ||
        !script.name ||
        typeof script.code !== "string" ||
        names.has(script.name)
      )
        return null;
      names.add(script.name);
    }
    const revision = JSON.stringify(
      values
        .map((script) => ({ name: script.name as string, code: script.code as string }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    return { names, revision };
  } catch {
    return null;
  }
}

/** Reads an OpenUI Cloud response: a stored message (see parseMessage) plus its scripts section. */
export function parseResponseBundle(response: string | null, streaming: boolean) {
  const text = response ?? "";
  // Framed once a content line is in. A line still streaming does not count yet.
  const line = CONTENT_LINE.exec(text);
  const framed = !!line && (!streaming || line[1] === "\n");
  const { content, attributes, end } = parseMessage(text.replace(BARE_SCRIPTS, "$& "), {
    streaming,
  });
  let program = content;
  // The scripts section is the first marker in the winning content, as Cloud writes it.
  let section = false;
  let scripts: Scripts | null = null;
  const at = markerIndex(program);
  if (at >= 0 && program.startsWith(SCRIPTS, at)) {
    section = true;
    const newline = program.indexOf("\n", at);
    let to = program.length;
    if (newline >= 0) {
      const next = markerIndex(program.slice(newline + 1));
      if (next >= 0) to = newline + 1 + next;
      scripts = readScripts(
        program.slice(at + SCRIPTS.length, newline),
        program.slice(newline + 1, to),
      );
    }
    // The newline before the section belongs to its marker (spec 7.2), unless the program is empty.
    const before = at > 0 ? program.slice(0, at).replace(/\r?\n$/, "") : "";
    const after = program.slice(to);
    program = after ? `${before}\n${after}` : before;
  }

  const metadata: ResponseMetadata = {};
  if (!framed && !section && !end) {
    const error: string | undefined = undefined;
    return {
      program,
      metadata,
      scripts: new Set<string>(),
      complete: true,
      isBundle: false,
      error,
    };
  }
  if (framed && attributes.name !== undefined) metadata.name = attributes.name;
  const error = section && !scripts ? "Invalid scripts bundle" : undefined;
  return {
    program,
    metadata,
    scripts: scripts?.names ?? new Set<string>(),
    // The end line only says the response is finished, so a stored message renders without one.
    // While streaming, a framed response is complete at its end line.
    complete: !error && (end || !streaming || !framed),
    isBundle: true,
    error: streaming ? undefined : error,
    ...(scripts?.names.size ? { scriptRevision: scripts.revision } : {}),
  };
}
