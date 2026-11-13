"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import type { DumbbellProps } from "../../../components/comparison/Dumbbell";
import { Dumbbell } from "../../../components/comparison/Dumbbell";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { dumbbellPropsSchema, type DumbbellSchemaProps } from "./schema";

export const DumbbellComponent = defineComponent({
  name: "Dumbbell",
  props: dumbbellPropsSchema,
  description:
    "Two values per category joined by a line (before and after, this year and last, two segments) so you see who moved and how far. Reads better than paired bars past a handful of categories.",
  component: DumbbellView,
});

function DumbbellView({ props }: ComponentRenderProps<DumbbellSchemaProps>) {
  return <Dumbbell {...props} />;
}

// Every schema field reaches Dumbbell.
export type DumbbellSchemaCovered = Covered<SchemaCoverage<DumbbellSchemaProps, DumbbellProps>>;
