"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Section } from "../../components/Section";
import { sectionPropsSchema, type SectionProps } from "./schema";

function SectionRenderer({ props, renderNode }: ComponentRenderProps<SectionProps>) {
  const filterBar = props["filterBar"];

  return (
    <Section filterBar={filterBar ? renderNode(filterBar) : undefined}>
      {renderNode(props.rows)}
    </Section>
  );
}

export const SectionComponent = defineComponent({
  name: "Section",
  props: sectionPropsSchema,
  description:
    "Major topical dashboard grouping with rows and an optional FilterBar. Use one Section for most dashboard content; add more Sections only for altogether different domains or topics.",
  component: SectionRenderer,
});
