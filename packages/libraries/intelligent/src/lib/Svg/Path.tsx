"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ok, paint, paintAttrs } from "./helpers";
import { Standalone } from "./standalone";

export const PathSchema = z.object({ d: z.string(), ...paint });

const PATH = /^[MmLlHhVvCcSsQqTtAaZz\d\s,.eE+-]*$/;
const ARITY: Record<string, number> = {
  m: 2,
  l: 2,
  t: 2,
  h: 1,
  v: 1,
  c: 6,
  s: 4,
  q: 4,
  a: 7,
  z: 0,
};
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i;
const FLAG = /^[01]/;

/**
 * Whether the last command has whole sets of arguments, so a `d` cut off mid-stream (`A 18 18 0 0 1 24`)
 * draws nothing rather than logging a browser error. An arc's two flags may be written without a
 * separator (`0 01 240 98`), so they are read as single digits.
 */
const complete = (d: string) => {
  const last = d.match(/[mlhvcsqtaz][^mlhvcsqtaz]*$/i)?.[0];
  if (!last) return d.trim() === "";
  const arity = ARITY[last[0]!.toLowerCase()]!;
  let rest = last.slice(1);
  let count = 0;
  for (;;) {
    rest = rest.replace(/^[\s,]+/, "");
    if (!rest) break;
    const slot = count % 7;
    const token = (arity === 7 && (slot === 3 || slot === 4) ? FLAG : NUMBER).exec(rest);
    if (!token) return false;
    rest = rest.slice(token[0].length);
    count++;
  }
  // A trailing "1." or "2e" still parses as a number, but more digits are on their way.
  if (/[.eE+-]$/.test(last.trimEnd())) return false;
  return arity === 0 ? count === 0 : count > 0 && count % arity === 0;
};

export const Path = defineComponent({
  name: "Path",
  props: PathSchema,
  description:
    "d is SVG path data only (M, L, C, A, Z...), else nothing draws; unfilled unless fill is set.",
  component: ({ props }) => {
    const d = ok(props.d, PATH);
    return (
      <Standalone>
        <path
          d={d !== undefined && complete(d) ? d : undefined}
          {...paintAttrs(props, props.fill !== undefined)}
        />
      </Standalone>
    );
  },
});
