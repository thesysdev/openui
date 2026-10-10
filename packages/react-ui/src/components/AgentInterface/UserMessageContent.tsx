import type { InputContent, Message } from "@openuidev/react-headless";
import clsx from "clsx";
import { useState } from "react";
import { readMessage } from "../../utils/messages";

/**
 * Renders the content of a user message.
 *
 * Handles the full AG-UI `InputContent` union (`@ag-ui/core` ≥ 0.0.53):
 * `text | image | audio | video | document | binary`.
 * - `image | audio | video | document` carry a `source` object
 *   (`{ type: "data" | "url", value, mimeType? }`).
 * - `binary` is the lower-level variant (`{ mimeType, url?, data?, filename? }`),
 *   routed to the right element by `mimeType`.
 *
 * Each part is resolved to a single render-ready descriptor in
 * {@link resolveInputPart}: media → `<img>/<audio>/<video>`, everything else →
 * a downloadable file chip. Every source (url + base64 `data`) is vetted against
 * a scheme/mime allowlist, and unusable/failed sources degrade to a chip rather
 * than being silently dropped. A `default: never` guard surfaces any future
 * union member at compile time.
 */

type ResolvedKind = "text" | "image" | "audio" | "video" | "file";

interface ResolvedPart {
  kind: ResolvedKind;
  /** Safe URL for an element `src`/`href`; `""` when no usable/allowed source. */
  src: string;
  filename?: string;
  /** alt / aria label text. */
  label: string;
  /** Raw text for `kind === "text"`. */
  text?: string;
  mimeType?: string;
}

// --- Security: vet sources before they reach the DOM. ---
const ALLOWED_URL_SCHEMES = ["http:", "https:"];
// `data:` is only embedded for media we render inline + PDFs we offer to
// download. Notably excludes text/html and arbitrary application/* (XSS surface).
const ALLOWED_DATA_MIME = /^(?:image|audio|video)\/|^application\/pdf$/i;

const isSafeBase64 = (v: string) => /^[A-Za-z0-9+/]+={0,2}$/.test(v.replace(/\s/g, ""));

/** Build a vetted `data:` URI, or `""` if the mime/payload isn't allowed. */
function buildDataUri(mimeType: string | undefined, value: string): string {
  if (!mimeType || !ALLOWED_DATA_MIME.test(mimeType)) return "";
  if (!isSafeBase64(value)) return "";
  return `data:${mimeType};base64,${value}`;
}

/** Vet a source URL: allow http(s) + allowlisted `data:`, reject javascript:/etc. */
function sanitizeUrl(raw: string): string {
  const s = raw.trim();
  if (s.startsWith("data:")) {
    const semi = s.indexOf(";");
    const mime = semi > 5 ? s.slice(5, semi) : "";
    return ALLOWED_DATA_MIME.test(mime) ? s : "";
  }
  try {
    // Absolute URL — gate on protocol.
    return ALLOWED_URL_SCHEMES.includes(new URL(s).protocol) ? s : "";
  } catch {
    // Relative URL (no scheme) — same-origin, can't carry a dangerous scheme.
    return s;
  }
}

/** mimeType → modality, used to route a `binary` part (which has no `type`). */
function modalityFromMime(mime: string): ResolvedKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

/** mimeType → short badge label for the file chip. */
function fileBadge(mime: string | undefined): string {
  if (!mime) return "FILE";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("sheet") || mime.includes("excel")) return "XLS";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "PPT";
  if (mime.includes("word") || mime.includes("document")) return "DOC";
  if (mime.startsWith("text/")) return "TXT";
  if (mime.startsWith("image/")) return "IMG";
  if (mime.startsWith("audio/")) return "AUD";
  if (mime.startsWith("video/")) return "VID";
  return "FILE";
}

/** Best-effort filename from an optional `metadata` bag (image/audio/video/document). */
function metaFilename(metadata: unknown): string | undefined {
  if (metadata && typeof metadata === "object" && "filename" in metadata) {
    const f = (metadata as Record<string, unknown>)["filename"];
    if (typeof f === "string" && f.length > 0) return f;
  }
  return undefined;
}

/** Resolve a media-style `source` ({ type:"data"|"url", value, mimeType }) to a vetted src. */
function resolveSource(source: { type: "data" | "url"; value: string; mimeType?: string }): string {
  return source.type === "url"
    ? sanitizeUrl(source.value)
    : buildDataUri(source.mimeType, source.value);
}

/** Resolve any `InputContent` part to a render-ready descriptor. */
export function resolveInputPart(part: InputContent): ResolvedPart {
  switch (part.type) {
    case "text":
      return { kind: "text", src: "", text: part.text, label: part.text };

    case "image":
    case "audio":
    case "video": {
      // { type; source: { type:"data"|"url"; value; mimeType? }; metadata? }
      const filename = metaFilename(part.metadata);
      return {
        kind: part.type,
        src: resolveSource(part.source),
        filename,
        mimeType: part.source.mimeType,
        label: filename ?? `${part.type} attachment`,
      };
    }

    case "document": {
      // Same source shape as media, but presented as a downloadable file chip.
      const filename = metaFilename(part.metadata);
      const mimeType = part.source.mimeType;
      return {
        kind: "file",
        src: resolveSource(part.source),
        filename,
        mimeType,
        label: filename ?? mimeType ?? "File",
      };
    }

    case "binary": {
      // { mimeType; url?; data?; filename?; id? }
      const { mimeType } = part;
      const src = part.url
        ? sanitizeUrl(part.url)
        : part.data
          ? buildDataUri(mimeType, part.data)
          : "";
      return {
        kind: modalityFromMime(mimeType),
        src,
        filename: part.filename,
        mimeType,
        label: part.filename ?? mimeType ?? "File",
      };
    }

    default: {
      // Exhaustiveness guard — surfaces new union members at compile time.
      const _exhaustive: never = part;
      void _exhaustive;
      return { kind: "file", src: "", label: "Unsupported attachment" };
    }
  }
}

const FileChip = ({ part, broken = false }: { part: ResolvedPart; broken?: boolean }) => {
  const name = part.filename ?? part.mimeType ?? "Attachment";
  const body = (
    <span
      className={clsx("openui-agent-thread-message-user__chip", {
        "openui-agent-thread-message-user__chip--broken": broken,
      })}
    >
      <span className="openui-agent-thread-message-user__chip-badge" aria-hidden="true">
        {fileBadge(part.mimeType)}
      </span>
      <span className="openui-agent-thread-message-user__chip-name">{name}</span>
    </span>
  );

  // Offer a download when we have a usable source.
  return part.src ? (
    <a
      href={part.src}
      download={part.filename ?? ""}
      rel="noreferrer"
      target="_blank"
      className="openui-agent-thread-message-user__chip-link"
      aria-label={`Download ${name}`}
    >
      {body}
    </a>
  ) : (
    body
  );
};

const MediaPart = ({ part }: { part: ResolvedPart }) => {
  const [error, setError] = useState(false);

  // No usable/allowed source, or a media element failed to load → file chip
  // (never silently drop, never show a broken-media glyph).
  if (!part.src || (error && part.kind !== "file")) {
    return <FileChip part={part} broken={Boolean(part.src) && error} />;
  }

  switch (part.kind) {
    case "image":
      return (
        <img
          src={part.src}
          alt={part.label}
          loading="lazy"
          className="openui-agent-thread-message-user__image"
          onError={() => setError(true)}
        />
      );
    case "audio":
      return (
        <figure className="openui-agent-thread-message-user__media">
          <audio
            controls
            preload="metadata"
            src={part.src}
            className="openui-agent-thread-message-user__audio"
            aria-label={part.label}
            onError={() => setError(true)}
          />
          {part.filename && (
            <figcaption className="openui-agent-thread-message-user__filename">
              {part.filename}
            </figcaption>
          )}
        </figure>
      );
    case "video":
      return (
        <video
          controls
          preload="metadata"
          src={part.src}
          className="openui-agent-thread-message-user__video"
          aria-label={part.label}
          onError={() => setError(true)}
        />
      );
    default:
      return <FileChip part={part} />;
  }
};

export const UserMessageContent = ({ message }: { message: Message }) => {
  if (message.role !== "user") return null;
  const content = message.content;

  if (typeof content === "string") {
    // Strip the marker lines (or older XML tags) so the bubble shows clean text.
    const { content: humanText } = readMessage(content);
    return <>{humanText}</>;
  }

  if (!content?.length) return null;

  // Render parts in array order to preserve the user's text/media interleave.
  return (
    <>
      {content.map((part, i) => {
        const resolved = resolveInputPart(part);
        if (resolved.kind === "text") {
          return resolved.text?.trim() ? (
            <span key={i} className="openui-agent-thread-message-user__text">
              {resolved.text}
            </span>
          ) : null;
        }
        return <MediaPart key={i} part={resolved} />;
      })}
    </>
  );
};
