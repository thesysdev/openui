import type { ToolCallStatus } from "@openuidev/react-headless";
import clsx from "clsx";
import type { ComponentType, ReactNode } from "react";

/**
 * Animated line-art glyphs for tool calls.
 *
 * Shapes and motion follow lucide-animated (https://lucide-animated.com): each
 * glyph is the Lucide icon of the same name on a 24-unit grid, with its hover
 * animation looped while the call runs. Motion is CSS-only (see
 * `toolCall.scss`, `.openui-tool-glyph`) and stops under
 * `prefers-reduced-motion`.
 *
 * @category Components
 */
export interface ToolGlyphProps {
  /** Rendered width and height in px. */
  size?: number;
  /** Loop the glyph's animation (e.g. while its tool call is running). */
  animate?: boolean;
  /** Stroke width on the 24-unit grid. Lucide's default is 2. */
  strokeWidth?: number;
  className?: string;
}

/** A tool glyph component. @category Types */
export type ToolGlyph = ComponentType<ToolGlyphProps>;

/**
 * How the timeline draws its glyphs: 20px in a 24px slot, with a stroke lighter
 * than Lucide's 2 so they carry the same weight as the mascot's ink lines.
 */
export const TIMELINE_GLYPH = { size: 20, strokeWidth: 1.6 } as const;

function GlyphFrame({
  name,
  size = 14,
  animate = false,
  strokeWidth = 2,
  className,
  children,
}: ToolGlyphProps & { name: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clsx(
        "openui-tool-glyph",
        `openui-tool-glyph--${name}`,
        { "openui-tool-glyph--animate": animate },
        className,
      )}
    >
      {children}
    </svg>
  );
}

/** Web search — Lucide `search`; the lens hops up, across and home. */
export const SearchGlyph = (props: ToolGlyphProps) => (
  <GlyphFrame name="search" {...props}>
    <g className="openui-tool-glyph__lens">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </g>
  </GlyphFrame>
);

/** Image search — Lucide `image`; the sun pops in and the hill draws across. */
export const ImageSearchGlyph = (props: ToolGlyphProps) => (
  <GlyphFrame name="image" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle className="openui-tool-glyph__sun" cx="9" cy="9" r="2" />
    <path
      className="openui-tool-glyph__hill"
      pathLength={1}
      d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
    />
  </GlyphFrame>
);

const SUN_RAYS = [
  "M12 2v2",
  "m4.93 4.93 1.41 1.41",
  "M20 12h2",
  "m19.07 4.93-1.41 1.41",
  "M15.947 12.65a4 4 0 0 0-5.925-4.128",
];

/** Weather — Lucide `cloud-sun`; the cloud wiggles and the rays light up in turn. */
export const WeatherGlyph = (props: ToolGlyphProps) => (
  <GlyphFrame name="weather" {...props}>
    {SUN_RAYS.map((d, i) => (
      <path
        key={d}
        className="openui-tool-glyph__ray"
        style={{ animationDelay: `${(i + 1) * 0.1}s` }}
        d={d}
      />
    ))}
    <path className="openui-tool-glyph__cloud" d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
  </GlyphFrame>
);

/** Artifacts and reports — Lucide `blocks`; the loose block slides into the corner and back. */
export const ArtifactGlyph = (props: ToolGlyphProps) => (
  <GlyphFrame name="artifact" {...props}>
    <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3" />
    <rect className="openui-tool-glyph__block" x="14" y="3" width="7" height="7" rx="1" />
  </GlyphFrame>
);

/** Any other tool — Lucide `terminal`; the cursor blinks after the prompt. */
export const TerminalGlyph = (props: ToolGlyphProps) => (
  <GlyphFrame name="terminal" {...props}>
    <path className="openui-tool-glyph__prompt" d="m4 17 6-6-6-6" />
    <path className="openui-tool-glyph__cursor" d="M12 19h8" />
  </GlyphFrame>
);

/** Thinking steps — Lucide `brain`; the folds breathe in and out. */
export const ThinkingGlyph = (props: ToolGlyphProps) => (
  <GlyphFrame name="brain" {...props}>
    <path className="openui-tool-glyph__fold" pathLength={1} d="M12 18V5" />
    <path
      className="openui-tool-glyph__fold openui-tool-glyph__fold--side"
      pathLength={1}
      d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"
    />
    <path
      className="openui-tool-glyph__fold openui-tool-glyph__fold--top"
      pathLength={1}
      d="M12 5A3 3 0 1 1 17.598 6.5"
    />
    <path
      className="openui-tool-glyph__fold openui-tool-glyph__fold--top"
      pathLength={1}
      d="M12 5A3 3 0 1 0 6.402 6.5"
    />
    <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
    <path
      className="openui-tool-glyph__fold openui-tool-glyph__fold--lower"
      pathLength={1}
      d="M18 18a4 4 0 0 0 2-7.464"
    />
    <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
    <path
      className="openui-tool-glyph__fold openui-tool-glyph__fold--lower"
      pathLength={1}
      d="M6 18a4 4 0 0 1-2-7.464"
    />
    <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
  </GlyphFrame>
);

/** Failed calls — Lucide `badge-alert`; the badge swells and shakes. */
export const ErrorGlyph = (props: ToolGlyphProps) => (
  <GlyphFrame name="error" {...props}>
    <g className="openui-tool-glyph__badge">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </g>
  </GlyphFrame>
);

// Built-in tool families that get their own glyph, matched on the tool name.
// Anything else falls back to the terminal glyph.
const TOOL_GLYPHS: { match: RegExp; glyph: ToolGlyph }[] = [
  { match: /image[_-]?search/i, glyph: ImageSearchGlyph },
  { match: /web[_-]?search/i, glyph: SearchGlyph },
  { match: /weather/i, glyph: WeatherGlyph },
  { match: /artifact|generate[_-]?report/i, glyph: ArtifactGlyph },
];

/**
 * Picks the glyph for a tool call from its name and status.
 *
 * @category Functions
 */
export function toolIcon(toolName: string, status: ToolCallStatus): ToolGlyph {
  if (status === "error") return ErrorGlyph;
  return TOOL_GLYPHS.find((entry) => entry.match.test(toolName))?.glyph ?? TerminalGlyph;
}
