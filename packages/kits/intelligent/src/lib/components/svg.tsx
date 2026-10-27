"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { children, color, fg, length, size } from "./style";

// Every attribute is checked here; nothing can load a resource or run code.
const n = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
const opacity = (value: unknown) => (n(value) === undefined ? undefined : Math.min(1, Math.max(0, value as number)));
const POINTS = /^[\d\s,.eE+-]*$/;
const PATH = /^[MmLlHhVvCcSsQqTtAaZz\d\s,.eE+-]*$/;
// Each transform function with a valid argument count, so a value built from
// state that is not set yet (like "rotate( 90 80)") is dropped, not sent to the DOM.
const TRANSFORM_ARGS: Record<string, number[]> = { translate: [1, 2], rotate: [1, 3], scale: [1, 2], skewX: [1], skewY: [1], matrix: [6] };
function transform(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 500) return undefined;
  const parts = [...value.matchAll(/\s*([a-zA-Z]+)\(([^()]*)\)\s*/g)];
  if (!parts.length || parts.map((p) => p[0]).join("") !== value) return undefined;
  const valid = parts.every(([, name, args]) => {
    const numbers = args.trim().split(/\s*,\s*|\s+/).filter(Boolean);
    return (TRANSFORM_ARGS[name]?.includes(numbers.length) ?? false) && numbers.every((n) => Number.isFinite(Number(n)));
  });
  return valid ? value.trim() : undefined;
}
const ok = (value: unknown, pattern: RegExp) => (typeof value === "string" && value.length < 20000 && pattern.test(value) ? value : undefined);

const paint = { fill: color.optional(), stroke: color.optional(), strokeWidth: z.number().optional(), opacity: z.number().optional() };
type Paint = { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number };

/** Filled shapes default to the text color; with only a stroke they stay unfilled. */
const paintAttrs = (p: Paint, filled: boolean) => ({
  fill: p.fill !== undefined ? (fg(p.fill) ?? "none") : filled && p.stroke === undefined ? "currentColor" : "none",
  stroke: p.stroke !== undefined ? fg(p.stroke) : filled ? undefined : "currentColor",
  strokeWidth: n(p.strokeWidth) ?? (filled ? undefined : 2),
  opacity: opacity(p.opacity),
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Svg = defineComponent({
  name: "Svg",
  props: z.object({
    children,
    viewBox: z.string(),
    width: length.optional(),
    height: length.optional(),
  }),
  description: "A drawing for steps, parts, mechanisms, diagrams and layouts. Scales to its width; its shapes take expressions, so state can move them.",
  component: ({ props, renderNode }) => {
    const viewBox = ok(props.viewBox, /^\s*[-\d.]+(\s*[\s,]\s*[-\d.]+){3}\s*$/) ?? "0 0 100 100";
    // Without a width it fills the column, up to 1.5x the viewBox (at least 280px), so text stays in scale.
    const natural = Number(viewBox.trim().split(/[\s,]+/)[2]);
    const maxWidth = props.width == null && natural > 0 ? `${Math.max(280, natural * 1.5)}px` : undefined;
    return (
      <svg className="iui-svg" viewBox={viewBox} style={{ width: size(props.width) ?? "100%", maxWidth, height: size(props.height) }} role="img" preserveAspectRatio="xMidYMid meet">
        {renderNode(props.children)}
      </svg>
    );
  },
});

export const Circle = defineComponent({
  name: "Circle",
  props: z.object({ cx: z.number(), cy: z.number(), r: z.number(), ...paint }),
  description: "",
  component: ({ props }) => <circle cx={n(props.cx)} cy={n(props.cy)} r={Math.max(0, n(props.r) ?? 0)} {...paintAttrs(props, true)} />,
});

export const Ellipse = defineComponent({
  name: "Ellipse",
  props: z.object({ cx: z.number(), cy: z.number(), rx: z.number(), ry: z.number(), ...paint }),
  description: "",
  component: ({ props }) => <ellipse cx={n(props.cx)} cy={n(props.cy)} rx={Math.max(0, n(props.rx) ?? 0)} ry={Math.max(0, n(props.ry) ?? 0)} {...paintAttrs(props, true)} />,
});

export const Rect = defineComponent({
  name: "Rect",
  props: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number(), ...paint, rx: z.number().optional() }),
  description: "",
  component: ({ props }) => (
    <rect x={n(props.x)} y={n(props.y)} width={Math.max(0, n(props.width) ?? 0)} height={Math.max(0, n(props.height) ?? 0)} rx={n(props.rx)} {...paintAttrs(props, true)} />
  ),
});

export const Line = defineComponent({
  name: "Line",
  props: z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number(), stroke: color.optional(), strokeWidth: z.number().optional(), opacity: z.number().optional() }),
  description: "",
  component: ({ props }) => <line x1={n(props.x1)} y1={n(props.y1)} x2={n(props.x2)} y2={n(props.y2)} {...paintAttrs(props, false)} />,
});

export const Path = defineComponent({
  name: "Path",
  props: z.object({ d: z.string(), ...paint }),
  description: "",
  component: ({ props }) => <path d={ok(props.d, PATH)} {...paintAttrs(props, props.fill !== undefined)} />,
});

export const Polyline = defineComponent({
  name: "Polyline",
  props: z.object({ points: z.string(), stroke: color.optional(), strokeWidth: z.number().optional(), fill: color.optional(), opacity: z.number().optional() }),
  description: 'points like "0,0 10,5 20,0".',
  component: ({ props }) => <polyline points={ok(props.points, POINTS)} {...paintAttrs(props, false)} />,
});

export const Polygon = defineComponent({
  name: "Polygon",
  props: z.object({ points: z.string(), ...paint }),
  description: "",
  component: ({ props }) => <polygon points={ok(props.points, POINTS)} {...paintAttrs(props, true)} />,
});

export const G = defineComponent({
  name: "G",
  props: z.object({ children, transform: z.string().optional(), opacity: z.number().optional() }),
  description: 'Group; transform like "rotate(30 50 50)" or "translate(10 0)".',
  component: ({ props, renderNode }) => (
    <g transform={transform(props.transform)} opacity={opacity(props.opacity)}>
      {renderNode(props.children)}
    </g>
  ),
});

export const SvgText = defineComponent({
  name: "SvgText",
  props: z.object({
    text: z.string(),
    x: z.number(),
    y: z.number(),
    size: z.number().optional(),
    fill: color.optional(),
    anchor: z.enum(["start", "middle", "end"]).optional(),
    weight: z.enum(["normal", "medium", "semibold"]).optional(),
  }),
  description: "",
  component: ({ props }) => (
    <text
      x={n(props.x)}
      y={n(props.y)}
      fontSize={n(props.size) ?? 12}
      fill={fg(props.fill) ?? "currentColor"}
      textAnchor={props.anchor ?? "start"}
      fontWeight={props.weight === "semibold" ? 640 : props.weight === "medium" ? 560 : 440}
      fontFamily="var(--iui-font)"
    >
      {String(props.text ?? "")}
    </text>
  ),
});

export const svgComponents = [Svg, Circle, Ellipse, Rect, Line, Path, Polyline, Polygon, G, SvgText];
