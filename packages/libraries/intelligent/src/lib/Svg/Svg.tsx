"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Svg as SvgView } from "../../components/Svg";
import { isElement, length } from "../schemas";
import { G, shapeComponents, shapes } from "./G";

const DRAWABLE = new Set([...shapeComponents.map((shape) => shape.name), G.name]);

export const SvgSchema = z.object({
  children: z.array(z.union([...shapes.element.options, G.ref])),
  viewBox: z.string(),
  width: length.optional(),
  height: length.optional(),
});

export const Svg = defineComponent({
  name: "Svg",
  props: SvgSchema,
  description:
    "A drawing for steps, parts, mechanisms, diagrams and layouts. Scales to its width; its shapes take expressions, so state can move them.",
  component: ({ props, renderNode }) => {
    // Page components given to a drawing show below it: inside an <svg> they would draw nothing.
    const nodes = (Array.isArray(props.children) ? props.children : []) as unknown[];
    const drawable = (node: unknown) =>
      isElement(node) && DRAWABLE.has(String((node as { typeName?: string }).typeName));
    const rest = nodes.filter((node) => !drawable(node));
    return (
      <>
        <SvgView viewBox={props.viewBox} width={props.width} height={props.height}>
          {renderNode(nodes.filter(drawable))}
        </SvgView>
        {rest.length ? renderNode(rest) : null}
      </>
    );
  },
});
