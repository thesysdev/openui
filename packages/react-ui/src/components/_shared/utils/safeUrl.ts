/**
 * Reject URLs whose scheme can execute JS in the host origin
 * (`javascript:`, `data:`, `vbscript:`, `file:`). Mirrors the regex used by
 * `sanitizeSvg` in MermaidDiagram/utils so the policy is consistent across
 * every LLM-controlled URL sink (anchor `href`, `window.open`, etc.).
 *
 * Returns the trimmed URL when safe, otherwise `undefined`.
 */
const DANGEROUS_URI_RE = /^\s*(?:javascript|data|vbscript|file)\s*:/i;

// Browsers strip ASCII control characters (and NBSP via String.trim) when
// parsing URL schemes, so `java\tscript:` resolves to `javascript:`.
// Strip them before the scheme check to defeat the classic obfuscation.
const SCHEME_OBFUSCATION_RE = /[\u0000-\u001F\u007F]/g;

export const safeUrl = (url: string | null | undefined): string | undefined => {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(SCHEME_OBFUSCATION_RE, "");
  if (DANGEROUS_URI_RE.test(normalized)) return undefined;
  return trimmed;
};

/**
 * The single allowed entry point for `window.open` in this package.
 *
 * - Validates the URL through `safeUrl` (rejects `javascript:`/`data:`/
 *   `vbscript:`/`file:` schemes, including control-char obfuscation).
 * - Defaults `target` to `_blank` and `features` to `noopener,noreferrer`
 *   to prevent reverse-tabnabbing.
 * - Returns the opened `Window`, or `null` if the URL was rejected or
 *   `window` is unavailable (SSR).
 *
 * Route every `window.open` call site through this util.
 */
export const safeOpenUrl = (
  url: string | null | undefined,
  target = "_blank",
  features = "noopener,noreferrer",
): Window | null => {
  if (typeof window === "undefined") return null;
  const safe = safeUrl(url);
  if (!safe) return null;
  return window.open(safe, target, features);
};

/**
 * Turn an LLM-controlled image URL into a `url("...")` CSS value, or `undefined`
 * when the URL is unsafe. Quotes, backslashes and newlines are escaped so the
 * value cannot break out of the declaration.
 */
export const toCssUrl = (url: string | null | undefined): string | undefined => {
  const safe = safeUrl(url);
  if (!safe) return undefined;
  const escaped = safe.replace(/[\\"\n\r]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `);
  return `url("${escaped}")`;
};
