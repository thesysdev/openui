"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Section, type SectionProps } from "../../../components/structure/Section";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { sectionPropsSchema, type SectionSchemaProps } from "./schema";

export const SectionComponent = defineComponent({
  name: "Section",
  props: sectionPropsSchema,
  description:
    'A titled group of Kpis strips and Rows of Cards. Pass "" as title for the lead KPI section.',
  component: SectionView,
});

function SectionView({ props, renderNode }: ComponentRenderProps<SectionSchemaProps>) {
  return (
    <Section title={props.title} description={props.description}>
      {renderNode(props.rows)}
    </Section>
  );
}

// Every schema field reaches Section (rows are rendered into children).
export type SectionSchemaCovered = Covered<
  SchemaCoverage<SectionSchemaProps, SectionProps, "rows">
>;
