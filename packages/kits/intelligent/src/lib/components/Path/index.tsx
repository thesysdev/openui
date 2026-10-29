"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ok, paintAttrs } from "../svgHelpers";
import { PathSchema } from "./schema";

export * from "./schema";

const PATH = /^[MmLlHhVvCcSsQqTtAaZz\d\s,.eE+-]*$/;

export const Path = defineComponent({
  name: "Path",
  props: PathSchema,
  description: "",
  component: ({ props }) => <path d={ok(props.d, PATH)} {...paintAttrs(props, props.fill !== undefined)} />,
});
