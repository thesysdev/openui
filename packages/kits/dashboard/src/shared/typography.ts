/**
 * openui's type scale as CSS declarations for a goober template:
 *
 *   ${typography("body", "small")}
 *
 * `font` is a shorthand, so it RESETS `font-variation-settings`. The axis is
 * emitted after the shorthand, never before. Fallbacks are react-components' light defaults.
 */

const FONT = `"Inter", sans-serif`;
const TRACKING = "-0.01em";
const REGULAR = ["regular", `"wght" 440`] as const;
const MEDIUM = ["medium", `"wght" 560`] as const;

/** [token suffix, default font, default tracking, Inter "wght" axis] — no axis means a fixed weight. */
const OPENUI_SCALE = {
  body: {
    default: ["body-default", `400 16px/1.5 ${FONT}`, TRACKING, REGULAR],
    small: ["body-sm", `400 14px/1.5 ${FONT}`, TRACKING, REGULAR],
    "large-heavy": ["body-lg-heavy", `560 18px/1.5 ${FONT}`, TRACKING, MEDIUM],
  },
  label: {
    small: ["label-sm", `400 14px/1.25 ${FONT}`, TRACKING, REGULAR],
    "extra-small": ["label-xs", `400 12px/1.25 ${FONT}`, TRACKING, REGULAR],
  },
  heading: {
    large: ["heading-lg", `600 28px/1.1 ${FONT}`, "-0.1px", null],
  },
  number: {
    default: ["numbers-default", `400 16px/1.5 ${FONT}`, TRACKING, REGULAR],
    small: ["numbers-sm", `400 14px/1.5 ${FONT}`, TRACKING, REGULAR],
    "heading-medium": ["numbers-heading-md", `600 24px/1.1 ${FONT}`, TRACKING, null],
  },
} as const;

type Scale = typeof OPENUI_SCALE;
type Entry = readonly [string, string, string, readonly [string, string] | null];

/** openui's shorthand type scale — `font`, `letter-spacing` and the weight axis. */
export function typography<R extends keyof Scale>(role: R, variant: keyof Scale[R]): string {
  const [token, font, tracking, axis] = OPENUI_SCALE[role][variant] as Entry;
  return [
    `font: var(--openui-text-${token}, ${font});`,
    `letter-spacing: var(--openui-text-${token}-letter-spacing, ${tracking});`,
    axis ? `font-variation-settings: var(--openui-font-variation-${axis[0]}, ${axis[1]});` : "",
  ]
    .filter(Boolean)
    .join("\n  ");
}
