"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Heading as OpenUIHeading } from "../../components/Heading";
import { getTextFont } from "../Text";
import { HeadingSchema, type HeadingProps } from "./schema";

export * from "./schema";

// Title follows the Text heading scale; the description is Text body (16px)
// in secondary at both sizes.
const SIZES = {
  default: { title: "h3", description: "body" },
  lg: { title: "h1", description: "body" },
} as const;

function HeadingRenderer({ props }: ComponentRenderProps<HeadingProps>) {
  const size = SIZES[props.size ?? "default"] ?? SIZES.default;
  return (
    <OpenUIHeading
      title={props.title}
      description={props.description}
      titleStyle={getTextFont(size.title)}
      descriptionStyle={getTextFont(size.description)}
      size={props.size ?? "default"}
    />
  );
}

export const Heading = defineComponent({
  name: "Heading",
  props: HeadingSchema,
  description:
    'A title with an optional one-line description under it, for titling a UI section such as a card group, chart or form. Most titles need no description. Add one only when it carries a fact the title lacks (a scope, unit, time range or what to do), e.g. Heading("Top products", "By units sold, last 30 days"). Never use it to greet, introduce yourself, restate the title or say what the section contains: not Heading("Hello!", "I\'m your AI assistant"), not Heading("Revenue", "Revenue overview"). size "default" (a section title inside a response) | "lg" (a hero title at the top of a page). Use Heading when a title needs that supporting line; use Text h1/h2/h3 for a bare title, and Markdown # headings for titled prose answers.',
  component: HeadingRenderer,
});
