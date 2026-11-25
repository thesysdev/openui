/**
 * Reads the artifact reference out of an artifact tool's response.
 *
 * The response is opaque to developers: a readable sentence for the model plus
 * OpenUI Cloud's content line (an OpenUI message with an empty body),
 *
 *   ]]>openui:content?artifact_id=art_…&type=dashboard&name=…&version=…
 *
 * Renderers pass it here unchanged, as a string or as an MCP tool result; nothing else parses it.
 */
import { parseMessage } from "@openuidev/react-lang";

/** The artifact a tool response points at. */
export interface ArtifactReference {
  id: string;
  type?: string;
  title?: string;
  /** Changes with every edit; a new one means there's a newer revision. */
  version?: string;
}

interface ArtifactHeader {
  artifact_id?: unknown;
  type?: unknown;
  name?: unknown;
  version?: unknown;
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

function toReference(header: ArtifactHeader): ArtifactReference | null {
  const id = asString(header.artifact_id);
  if (!id) return null;
  return {
    id,
    type: asString(header.type),
    title: asString(header.name),
    version: asString(header.version),
  };
}

function parseHeader(text: string): ArtifactReference | null {
  return toReference(parseMessage(text).attributes);
}

/** A tool's result: a string, or an MCP tool result or its parts, possibly JSON-encoded. */
export type ArtifactToolResponse = string | { readonly content?: unknown } | readonly unknown[];

/** The text parts of an MCP tool result, or of its content array, joined. */
function partsText(value: unknown): string | undefined {
  const parts = Array.isArray(value)
    ? value
    : typeof value === "object" &&
        value !== null &&
        Array.isArray((value as { content?: unknown }).content)
      ? (value as { content: unknown[] }).content
      : undefined;
  const texts = parts?.flatMap((part) =>
    typeof part === "object" && part !== null && (part as { type?: unknown }).type === "text"
      ? [String((part as { text?: unknown }).text ?? "")]
      : [],
  );
  return texts?.length ? texts.join("\n") : undefined;
}

/** A tool result's text. */
function responseText(response: unknown): string | undefined {
  if (typeof response !== "string") return partsText(response);
  // Some frameworks JSON-encode results; undecoded, the content line runs into the JSON.
  const first = response.trimStart()[0];
  if (first === '"' || first === "{" || first === "[") {
    try {
      const decoded: unknown = JSON.parse(response);
      return typeof decoded === "string" ? decoded : (partsText(decoded) ?? response);
    } catch {
      // Not JSON after all: read it as is.
    }
  }
  return response;
}

/**
 * The artifact a tool response points at, or `null` when it doesn't carry one.
 */
export function parseArtifactReference(response: unknown): ArtifactReference | null {
  const text = responseText(response);
  return text ? parseHeader(text) : null;
}
