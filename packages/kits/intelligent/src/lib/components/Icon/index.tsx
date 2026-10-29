"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Glyph } from "../glyph";
import { fg } from "../style";
import { IconSchema } from "./schema";

export * from "./schema";

const ICON_SIZE = { sm: 14, md: 18, lg: 24, xl: 32 } as const;

export const Icon = defineComponent({
  name: "Icon",
  props: IconSchema,
  description: 'Lucide icon by name, e.g. "map-pin".',
  component: ({ props }) => (
    <span className="iui-icon" style={{ color: fg(props.color) }}>
      <Glyph name={props.name} size={ICON_SIZE[props.size ?? "md"] ?? 18} />
    </span>
  ),
});
