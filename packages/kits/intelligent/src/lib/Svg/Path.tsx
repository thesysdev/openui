"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ok, paint, paintAttrs } from "./helpers";
import { Standalone } from "./standalone";

export const PathSchema = z.object({ d: z.string(), ...paint });

const PATH = /^[MmLlHhVvCcSsQqTtAaZz\d\s,.eE+-]*$/;

export const Path = defineComponent({
  name: "Path",
  props: PathSchema,
  description:
    "d is SVG path data only (M, L, C, A, Z...), else nothing draws; unfilled unless fill is set.",
  component: ({ props }) => (
    <Standalone>
      <path d={ok(props.d, PATH)} {...paintAttrs(props, props.fill !== undefined)} />
    </Standalone>
  ),
});
