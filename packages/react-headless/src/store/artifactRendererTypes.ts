import type { ReactNode } from "react";

/**
 * Controls passed to a renderer's `preview` and `actual` render functions.
 *
 * @category Types
 */
export interface ArtifactRendererControls {
  /** Whether this renderer's detailed view is the currently active one. */
  isActive: boolean;
  /**
   * `true` while the tool call is still streaming — i.e. its arguments are
   * arriving incrementally and no tool result has been paired in yet. Becomes
   * `false` once the tool result message lands and the renderer is invoked
   * with the full `response`. Always `false` for storage-opened artifacts.
   *
   * The same component instance is reused across the streaming → completed
   * transition, so renderers can rely on this flag to swap UI states (e.g.
   * show a skeleton or "streaming…" badge during partial args, then the final
   * view) without remounting.
   */
  isStreaming: boolean;
  /** Activates this renderer's detailed view. */
  open: () => void;
  /** Closes this renderer's detailed view if currently active. */
  close: () => void;
  /** Toggles this renderer's detailed view. */
  toggle: () => void;
}

/**
 * Result of a renderer's `parser`.
 *
 * - Returning `null` from `parser` skips rendering this tool call entirely.
 * - `meta: null` renders preview/actual but skips ThreadContext registration —
 *   a common pattern while `ctx.isStreaming` is `true` so the entry only
 *   appears in the registry once the tool result has arrived.
 *
 * @category Types
 */
export interface ParsedArtifact<Props> {
  props: Props;
  // `type`, when a parser provides it, is the artifact's REAL kind. It lets the
  // ThreadContext registration label/resolve the artifact by its own kind even
  // when a single tool-owning renderer matched the tool name (e.g. one renderer
  // owns the generate/edit tools but emits both presentations and reports).
  // Optional: parsers that don't set it fall back to the matched renderer's type.
  meta: { id: string; version: number; heading: string; type?: string } | null;
}

/**
 * Configuration for a single artifact renderer, returned by {@link defineArtifactRenderer}.
 *
 * Renderers are matched against tool calls by `toolName` (one or many literal
 * strings) and against stored artifacts by `type`. When a match fires, `parser`
 * converts the raw envelope into typed `Props` + an optional ThreadContext
 * `meta` entry, and `preview` / `actual` render the inline chat preview and
 * the full view respectively.
 *
 * @category Types
 */
export interface ArtifactRendererConfig<Props = unknown> {
  /**
   * Artifact type this renderer handles, e.g. `"th_presentation"`.
   * Links the renderer to {@link ArtifactCategory} filters and to stored
   * artifacts (`ArtifactSummary.type`) for thread-independent rendering.
   */
  type: string;
  /**
   * Tool name(s) to match. Literal strings only; first registration wins on
   * duplicates. An array registers the same renderer for several tools.
   */
  toolName: string | string[];
  /**
   * Converts the raw envelope into `{ props, meta }`.
   *
   * Tool-call path: receives `{ args, response }` exactly as the backend
   * emitted them — the SDK does not pre-parse JSON. Called on every update,
   * including during streaming, so implementations must tolerate:
   *  - `args` as a *partial* JSON string (the LLM is still emitting it), and
   *  - `response` as `null` (the tool result hasn't arrived yet — see
   *    {@link ArtifactRendererControls.isStreaming}).
   *
   * Storage path (artifact browser): receives `{ args: undefined, response: artifact.content }` —
   * stored `content` must therefore have the same shape as the tool-call response.
   *
   * Return `null` to skip rendering. Return `meta: null` to render without
   * registering in the ThreadContext (entry hidden from workspace lists).
   * `meta.id` should be stable across re-runs of the same logical entry —
   * when `(id, version)` changes, the registry entry is re-registered.
   */
  parser: (
    raw: { args: unknown; response: unknown },
    ctx: { isStreaming: boolean },
  ) => ParsedArtifact<Props> | null;
  /** Renders the inline preview shown in the chat message. */
  preview: (props: Props, controls: ArtifactRendererControls) => ReactNode;
  /** Renders the full artifact view (side panel in-thread, full page in the artifact browser). */
  actual: (props: Props, controls: ArtifactRendererControls) => ReactNode;
  /**
   * Icon for this artifact type, used by the artifact nav for the category this
   * type belongs to. A platform-neutral node (a web element or a React Native
   * element). When a category groups several types, the nav uses the first
   * member type's icon; if none is set the UI falls back to a generic default.
   */
  icon?: ReactNode;
  /**
   * Human-readable display label for this artifact type, shown as the type
   * metadata on artifact browser cards and workspace items (e.g. `"Report"`).
   * When omitted, the UI prettifies the `type` id (never shows the raw id).
   * Mirrors `icon` — declared via `defineArtifactRenderer({ label })`.
   */
  label?: string;
}

/**
 * Identity helper that returns its argument while preserving `Props` inference.
 *
 * Without this, users would have to write `const r: ArtifactRendererConfig<MyProps> = {...}`
 * to get type checking. With it, `defineArtifactRenderer({...})` infers `Props`
 * from `parser`'s return type.
 *
 * @category Functions
 *
 * @example
 * ```ts
 * const presentationRenderer = defineArtifactRenderer({
 *   type: "th_presentation",
 *   toolName: ["presentation:create", "presentation:edit"],
 *   parser: ({ response }) => {
 *     const slides = response as { id: string; slides: Slide[] } | null;
 *     if (!slides) return null;
 *     return {
 *       props: slides,
 *       meta: { id: slides.id, version: 1, heading: `Presentation ${slides.id}` },
 *     };
 *   },
 *   preview: (props, controls) => <PresentationCard onOpen={controls.open} />,
 *   actual: (props) => <SlideDeck slides={props.slides} />,
 * });
 * ```
 */
export function defineArtifactRenderer<Props>(
  config: ArtifactRendererConfig<Props>,
): ArtifactRendererConfig<Props> {
  return config;
}
