// The OpenUI message protocol (spec section 7): marker lines around a stored response,
// e.g. `]]>openui:content?library=x`, `]]>openui:context`, `]]>openui:end`.

const PREFIX = "]]>openui:";
const MARKER = /^\]\]>openui:([a-z]+)(?:\?(.*))?$/;

export interface ParsedMessage {
  /** Body of the last `content` section, or the whole text when there is none. */
  content: string;
  /** Body of the `context` section: parsed JSON, else raw text. null when absent. */
  context: unknown;
  /** String attributes of the winning `content` marker. */
  attributes: Record<string, string>;
  /** An `end` line is present. */
  end: boolean;
}

export interface ParseMessageOptions {
  /** Hold back a last line that may be a marker cut mid-stream. */
  streaming?: boolean;
}

export interface BuildMessageInput {
  content: string;
  /** Written as is when a string, else as JSON. Omitted when null or undefined. */
  context?: unknown;
  attributes?: Record<string, string>;
  end?: boolean;
}

interface Section {
  kind: string | null;
  attributes: Record<string, string>;
  lines: string[];
}

// Same bytes as URLSearchParams, which React Native only partly implements.
const encode = (s: string) =>
  encodeURIComponent(s)
    .replace(/[!'()~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");

const decode = (s: string) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
};

function readAttributes(query = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of query.split("&")) {
    const eq = pair.indexOf("=");
    const key = decode(eq === -1 ? pair : pair.slice(0, eq));
    if (key) out[key] = eq === -1 ? "" : decode(pair.slice(eq + 1));
  }
  return out;
}

/** Splits a stored message into its content, context, attributes and end flag. */
export function parseMessage(raw: string, { streaming }: ParseMessageOptions = {}): ParsedMessage {
  const lines = raw.split("\n");
  const last = lines[lines.length - 1];
  const held = streaming && last !== "" && (last.startsWith(PREFIX) || PREFIX.startsWith(last));
  if (held) lines.pop();

  const sections: Section[] = [{ kind: null, attributes: {}, lines: [] }];
  // The newline (and its `\r`) before a marker is not part of the body.
  const close = () => {
    const body = sections[sections.length - 1].lines;
    if (body.length) body[body.length - 1] = body[body.length - 1].replace(/\r$/, "");
  };
  let end = false;
  for (const [i, line] of lines.entries()) {
    const match = MARKER.exec(line.replace(/\r$/, ""));
    if (!match) {
      sections[sections.length - 1].lines.push(line);
      continue;
    }
    close();
    if (match[1] === "end") {
      end = true;
      if (i === lines.length - 2 && lines[i + 1] === "") break;
      continue;
    }
    sections.push({ kind: match[1], attributes: readAttributes(match[2]), lines: [] });
  }
  if (held) close();

  // Last content wins; text before the first marker is content only when there is none.
  const kinds = sections.map((s) => s.kind);
  const win = Math.max(0, kinds.lastIndexOf("content"));
  const ctx = kinds.lastIndexOf("context");
  let context: unknown = ctx > win ? sections[ctx].lines.join("\n") : null;
  try {
    if (typeof context === "string") context = JSON.parse(context);
  } catch {
    // Not JSON (yet): keep the raw text.
  }
  const winner = sections[win];
  return { content: winner.lines.join("\n"), context, attributes: winner.attributes, end };
}

/** Writes a stored message with its marker lines. */
export function buildMessage({ content, context, attributes, end }: BuildMessageInput): string {
  const query = Object.entries(attributes ?? {})
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join("&");
  let out = `${PREFIX}content${query ? `?${query}` : ""}\n${content}`;
  if (context != null) {
    out += `\n${PREFIX}context\n${typeof context === "string" ? context : JSON.stringify(context)}`;
  }
  return end ? `${out}\n${PREFIX}end` : out;
}
