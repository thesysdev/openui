/**
 * Reads the artifact reference out of an artifact tool's response.
 *
 * The response is opaque to developers: a readable sentence for the model plus
 * OpenUI Cloud's content line (an OpenUI message with an empty body),
 *
 *   ]]>openui:content?artifact_id=art_…&type=dashboard&name=…&version=…
 *
 * Renderers pass it here unchanged; nothing else parses it.
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

/**
 * The artifact a tool response points at, or `null` when it doesn't carry one.
 */
export function parseArtifactReference(response: unknown): ArtifactReference | null {
  if (typeof response !== "string" || !response) return null;
  // Some agent frameworks hand back a tool's string result JSON-encoded. Decode
  // it first: its content line would otherwise read up to the closing quote.
  if (response.startsWith('"')) {
    try {
      const decoded: unknown = JSON.parse(response);
      if (typeof decoded === "string") return parseHeader(decoded);
    } catch {
      // Not JSON after all: read it as is.
    }
  }
  return parseHeader(response);
}
