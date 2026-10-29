"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { children } from "../style";
import { opacity } from "./helpers";

export const GSchema = z.object({ children, transform: z.string().optional(), opacity: z.number().optional() });

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

export const G = defineComponent({
  name: "G",
  props: GSchema,
  description: 'Group; transform like "rotate(30 50 50)" or "translate(10 0)".',
  component: ({ props, renderNode }) => (
    <g transform={transform(props.transform)} opacity={opacity(props.opacity)}>
      {renderNode(props.children)}
    </g>
  ),
});
