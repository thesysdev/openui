"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Stat, type StatProps } from "../../../components/metrics/Stat";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { statPropsSchema, type StatSchemaProps } from "./schema";

export const StatComponent = defineComponent({
  name: "Stat",
  props: statPropsSchema,
  description: "Headline number at the top of a Card, with change vs previous.",
  component: StatView,
});

function StatView({ props }: ComponentRenderProps<StatSchemaProps>) {
  return <Stat {...props} />;
}

// Every schema field reaches Stat.
export type StatSchemaCovered = Covered<SchemaCoverage<StatSchemaProps, StatProps>>;
