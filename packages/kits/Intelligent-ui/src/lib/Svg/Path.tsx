"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ok, paint, paintAttrs } from "./helpers";

export const PathSchema = z.object({ d: z.string(), ...paint });

const PATH = /^[MmLlHhVvCcSsQqTtAaZz\d\s,.eE+-]*$/;

export const Path = defineComponent({
  name: "Path",
  props: PathSchema,
  description: "",
  component: ({ props }) => <path d={ok(props.d, PATH)} {...paintAttrs(props, props.fill !== undefined)} />,
});
