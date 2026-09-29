/** Metadata emitted by OpenUI Cloud. */
export interface ResponseMetadata {
  name?: string;
}

const CONTENT = "]]>openui:content";
const SCRIPTS = "]]>openui:scripts";
const END = "]]>openui:end";

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

export function parseResponseBundle(response: string | null, streaming: boolean) {
  let program = response ?? "";
  const metadata: ResponseMetadata = {};
  const scripts = new Set<string>();
  let error: string | undefined;
  let complete = true;
  let framed = false;
  let body = program.trimStart();
  if (body && (body.startsWith(CONTENT) || CONTENT.startsWith(body))) {
    framed = true;
    const newline = body.indexOf("\n");
    if (newline < 0)
      return {
        isBundle: true,
        program: "",
        metadata,
        scripts,
        complete: false,
        error: streaming ? undefined : "Incomplete response header",
      };
    const header = body.slice(0, newline).trimEnd();
    const name = new URLSearchParams(header.slice(CONTENT.length).replace(/^\?/, "")).get("name");
    if (name !== null) metadata.name = name;
    body = body.slice(newline + 1);
  }
  program = body;
  const marker = markerIndex(body, framed && streaming);
  const isBundle = framed || marker >= 0;
  if (!isBundle) {
    return { program: response ?? "", metadata, scripts, complete, isBundle, error };
  }
  if (marker >= 0) {
    program = body.slice(0, marker);
    let tail = body.slice(marker).trimEnd();
    if (tail.startsWith(SCRIPTS)) {
      complete = false;
      const newline = tail.indexOf("\n");
      if (newline >= 0) {
        try {
          const header = JSON.parse(tail.slice(SCRIPTS.length, newline));
          let payload = tail.slice(newline + 1);
          const end = markerIndex(payload);
          if (end >= 0) {
            tail = payload.slice(end).trim();
            payload = payload.slice(0, end);
          } else tail = "";
          const values: unknown = JSON.parse(payload);
          if (
            !Array.isArray(values) ||
            !Number.isSafeInteger(header.count) ||
            header.count !== values.length
          )
            throw new Error("Invalid script count");
          for (const script of values) {
            if (
              !script ||
              typeof script.name !== "string" ||
              !script.name ||
              typeof script.code !== "string" ||
              scripts.has(script.name)
            )
              throw new Error("Invalid or duplicate script definition");
            scripts.add(script.name);
          }
          complete = framed ? tail === END : tail === "" || tail === END;
          if (!complete) error = "Incomplete response bundle";
        } catch {
          error = "Invalid scripts bundle";
        }
      }
    } else {
      complete = tail === END;
      if (!complete) error = "Incomplete response bundle";
    }
  } else if (framed) complete = false;
  if (!complete && !streaming) error ??= "Incomplete response bundle";
  return { program, metadata, scripts, complete, isBundle, error: streaming ? undefined : error };
}
