import { parseMessage } from "@openuidev/lang-core";

/** Metadata emitted by OpenUI Cloud. */
export interface ResponseMetadata {
  name?: string;
}

// OpenUI Cloud writes its scripts after the program: `]]>openui:scripts {"count":1}`, then
// `[{"name":"sales_total","code":"async ({ tools }) => …"}]`. This file cuts that section out;
// parseMessage reads the rest (content, attributes, end).
const SCRIPTS = "]]>openui:scripts";
const CONTENT_LINE = /^\]\]>openui:content(?:\?.*)?\r?$/;

interface Scripts {
  names: Set<string>;
  revision: string;
}

// Markers inside DSL/JSON strings are ordinary content.
function markerIndex(text: string, partial = false): number {
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
    else if (text.startsWith("]]>", i) || (partial && "]]>".startsWith(text.slice(i)))) return i;
  }
  return -1;
}

// Where the winning content begins: after the last content line. A line still streaming does not count yet.
function contentStart(text: string, streaming: boolean): number {
  let start = -1;
  for (let i = 0; i < text.length;) {
    const newline = text.indexOf("\n", i);
    const lineEnd = newline < 0 ? text.length : newline;
    if (text.startsWith("]]>openui:content", i) && CONTENT_LINE.test(text.slice(i, lineEnd))) {
      if (newline >= 0) start = newline + 1;
      else if (!streaming) start = text.length;
    }
    if (newline < 0) break;
    i = newline + 1;
  }
  return start;
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
  let text = response ?? "";
  const start = contentStart(text, streaming);
  const framed = start >= 0;
  const body = Math.max(start, 0);
  // The scripts section is the first marker after the winning content, as Cloud writes it.
  let section = false;
  let scripts: Scripts | null = null;
  let invalid = false;
  const at = markerIndex(text.slice(body), framed && streaming);
  if (at >= 0) {
    const from = body + at;
    const tail = text.slice(from);
    if (tail.startsWith(SCRIPTS) || (framed && streaming && SCRIPTS.startsWith(tail))) {
      section = true;
      const newline = text.indexOf("\n", from);
      let to = text.length;
      if (newline >= 0) {
        const next = markerIndex(text.slice(newline + 1));
        if (next >= 0) to = newline + 1 + next;
        scripts = readScripts(
          text.slice(from + SCRIPTS.length, newline),
          text.slice(newline + 1, to),
        );
        invalid = !scripts;
      }
      // The newline before the section belongs to its marker (spec 7.2), unless the program is empty.
      let before = text.slice(0, from);
      if (from > body) before = before.replace(/\r?\n$/, "");
      const after = text.slice(to);
      text = after ? `${before}\n${after}` : before;
    }
  }

  const { content, attributes, end } = parseMessage(text, { streaming });
  const metadata: ResponseMetadata = {};
  if (!framed && !section && !end) {
    const error: string | undefined = undefined;
    return {
      program: content,
      metadata,
      scripts: new Set<string>(),
      complete: true,
      isBundle: false,
      error,
    };
  }
  if (framed && attributes.name !== undefined) metadata.name = attributes.name;
  // A framed response is finished at its end line; an unframed one (program, then scripts) without one.
  let error = invalid ? "Invalid scripts bundle" : undefined;
  if (!error && !end && (framed || !scripts)) error = "Incomplete response bundle";
  return {
    program: content,
    metadata,
    scripts: scripts?.names ?? new Set<string>(),
    complete: !error,
    isBundle: true,
    error: streaming ? undefined : error,
    ...(scripts?.names.size ? { scriptRevision: scripts.revision } : {}),
  };
}
