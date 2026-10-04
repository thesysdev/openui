"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { sectionPropsSchema, type SectionProps } from "./schema";

function SectionRenderer({ props, renderNode }: ComponentRenderProps<SectionProps>) {
  const filterBar = props["filterBar"];

  return (
    <section className={`${DASHBOARD_CLASS_PREFIX}-section`}>
      {filterBar ? (
        <div className={`${DASHBOARD_CLASS_PREFIX}-section__filter`}>{renderNode(filterBar)}</div>
      ) : null}
      <div className={`${DASHBOARD_CLASS_PREFIX}-section__rows`}>{renderNode(props.rows)}</div>
    </section>
  );
}

export const SectionComponent = defineComponent({
  name: "Section",
  props: sectionPropsSchema,
  description:
    "Major topical dashboard grouping with rows and an optional FilterBar. Use one Section for most dashboard content; add more Sections only for altogether different domains or topics.",
  component: SectionRenderer,
});
