"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Section as OpenUISection } from "../../components/Section";
import { SectionSchema, type SectionProps } from "./schema";

export * from "./schema";

// Children are loose so the chat Section, with its own children union, can share this renderer.
type SectionRenderProps = ComponentRenderProps<
  Omit<SectionProps, "children"> & { children: unknown[] }
>;

/** Shared renderer — also used by the chat library's Section variant (typed children). */
export function SectionRenderer({ props, renderNode }: SectionRenderProps) {
  return <OpenUISection>{renderNode(props.children)}</OpenUISection>;
}

export const SECTION_DESCRIPTION = `One part of a response. Every response is built from Sections: put each distinct part (an overview, then options, then next steps) in its own Section, directly in the root, so parts get more space between them and their own children sit close together. A short single-part answer is one Section. Sections are high-level divisions, and many responses need only one: never give a lone Text, Markdown or Buttons row its own Section, nor a Section that holds only a title (a Heading or Text, with or without a subtitle; it goes at the top of the Section with the content it introduces), e.g. not Section([Markdown("Here is a snapshot…")]) followed by the table it introduces. Put an intro first inside the Section it introduces, and closing actions last in the final Section. Children stack top to bottom; compose the part yourself inside it: a Heading or Text h2/h3 title first when the part needs one, then Markdown, a Stack row or grid, a card block, a chart. Prose inside a titled Section is a Markdown block without its own # heading. e.g. Section([Heading("Where to stay"), hotels]). Never nest a Section inside a Section. For parts the reader opens on demand (an FAQ, a long report) use the collapsible SectionBlock inside a Section, and for alternative views of the same thing use Tabs.`;

export const Section = defineComponent({
  name: "Section",
  props: SectionSchema,
  description: SECTION_DESCRIPTION,
  component: SectionRenderer,
});
