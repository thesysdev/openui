/**
 * Reads the artifact reference out of an artifact tool's response.
 *
 * The response is opaque to developers: a readable sentence for the model plus
 * OpenUI Cloud's artifact header line,
 *
 *   ]]>openui:artifact {"artifact_id":"art_…","type":"live","definition":"…","name":"…","version":"…"}
 *
 * Renderers pass it here unchanged; nothing else parses it.
 */

const ARTIFACT_MARKER = "]]>openui:artifact";

/** @category Types */
export interface ArtifactReference {
  id: string;
  type?: string;
  /** The dashboard definition that made it. Interpreter requests carry it. */
  definition?: string;
  title?: string;
  /** Changes with every edit; a new one means there's a newer revision. */
  version?: string;
}

interface ArtifactHeader {
  artifact_id?: unknown;
  type?: unknown;
  definition?: unknown;
  name?: unknown;
  version?: unknown;
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

function parseHeader(text: string): ArtifactReference | null {
  const at = text.indexOf(ARTIFACT_MARKER);
  if (at === -1) return null;
  const lineEnd = text.indexOf("\n", at);
  const json = text.slice(at + ARTIFACT_MARKER.length, lineEnd === -1 ? undefined : lineEnd);
  try {
    const header = JSON.parse(json.trim()) as ArtifactHeader;
    const id = asString(header.artifact_id);
    if (!id) return null;
    return {
      id,
      type: asString(header.type),
      definition: asString(header.definition),
      title: asString(header.name),
      version: asString(header.version),
    };
  } catch {
    return null;
  }
}

/**
 * The artifact a tool response points at, or `null` when it doesn't carry one.
 *
 * @category Functions
 */
export function parseArtifactReference(response: unknown): ArtifactReference | null {
  if (typeof response !== "string" || !response) return null;
  const reference = parseHeader(response);
  if (reference) return reference;

  // Some agent frameworks hand back a tool's string result JSON-encoded.
  if (response.startsWith('"')) {
    try {
      const decoded: unknown = JSON.parse(response);
      if (typeof decoded === "string") return parseHeader(decoded);
    } catch {
      return null;
    }
  }
  return null;
}
