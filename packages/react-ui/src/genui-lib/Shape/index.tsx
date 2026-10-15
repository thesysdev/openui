"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Shape as OpenUIShape } from "../../components/Shape";
import { ShapeSchema, type ShapeProps } from "./schema";

export * from "./schema";

function ShapeRenderer({ props }: ComponentRenderProps<ShapeProps>) {
  return (
    <OpenUIShape
      shape={props.shape}
      color={props.color ?? undefined}
      label={props.label ?? undefined}
    />
  );
}

export const Shape = defineComponent({
  name: "Shape",
  props: ShapeSchema,
  description:
    'A small solid shape sized like an Icon. It only goes inside a Tag, a LeadingText or an Avatar\'s icon slot, never on its own. Use it where a plain colored mark says more than a picture: a status dot, Tag("Online", Shape("circle", "success")); a legend or category marker, LeadingText(Shape("square", "purple"), Text("Design")); or a trend arrow, LeadingText(Shape("triangle-up", "success"), Text("+12% this week")) or triangle-down with "danger". Use an Icon instead when the mark has to depict something. shape "circle" | "square" | "diamond" | "triangle-up" | "triangle-down" | "triangle-left" | "triangle-right" | "hexagon". color is "neutral" (default) | "info" | "success" | "warning" | "danger" | "purple" | "pink" | "inverted", picked by meaning like Tag variants, with purple and pink for telling categories apart; keep one meaning per color within a response. label is the accessible name: give one when the shape carries meaning without text beside it, omit it when decorative.',
  component: ShapeRenderer,
});
